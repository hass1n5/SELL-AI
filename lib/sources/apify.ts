import {createEvidence} from '../evidence';
import type {EvidenceItem,ProviderHealth,ResearchJob} from '../types';
import type {RawSourceData,SourceAdapter} from './registry';

const APIFY_API_BASE='https://api.apify.com/v2';
const RETRYABLE_STATUS=new Set([408,425,429,500,502,503,504]);

export interface ApifyConfig{
 token?:string;
 actorId?:string;
 baseUrl:string;
 timeoutMs:number;
 maxRetries:number;
 pollIntervalMs:number;
 maxPolls:number;
}
export interface ApifyRunInput{query:string;region:string;actorId?:string;input?:Record<string,unknown>;job:ResearchJob;}
export interface ApifyRunResult{job:ResearchJob;evidence:EvidenceItem[];runId:string;}

export type ApifyErrorCode='missing_credentials'|'invalid_auth'|'rate_limited'|'timeout'|'run_failed'|'malformed_response'|'unavailable';
export class ApifyProviderError extends Error{
 constructor(public readonly code:ApifyErrorCode,message:string,public readonly status?:number){super(message);this.name='ApifyProviderError';}
}

const positiveInt=(value:string|undefined,fallback:number)=>{const parsed=Number(value);return Number.isFinite(parsed)&&parsed>0?Math.floor(parsed):fallback;};
export function getApifyConfig(env:NodeJS.ProcessEnv=process.env):ApifyConfig{
 return{token:env.APIFY_API_TOKEN?.trim()||undefined,actorId:env.APIFY_ACTOR_ID?.trim()||undefined,baseUrl:(env.APIFY_API_BASE_URL||APIFY_API_BASE).replace(/\/$/,''),timeoutMs:positiveInt(env.APIFY_TIMEOUT_MS,15000),maxRetries:Math.min(5,positiveInt(env.APIFY_MAX_RETRIES,2)),pollIntervalMs:positiveInt(env.APIFY_POLL_INTERVAL_MS,1000),maxPolls:Math.min(300,positiveInt(env.APIFY_MAX_POLLS,30))};
}

const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
function retryDelay(attempt:number){return Math.min(5000,250*2**attempt);}
function errorForStatus(status:number){if(status===401||status===403)return new ApifyProviderError('invalid_auth','Apify authentication was rejected.',status);if(status===429)return new ApifyProviderError('rate_limited','Apify rate limit reached.',status);return new ApifyProviderError('unavailable',`Apify request failed with status ${status}.`,status);}

export class ApifyProviderAdapter implements SourceAdapter{
 readonly id='apify'; readonly name='Apify'; readonly type='search' as const; readonly available:boolean;
 constructor(public readonly config:ApifyConfig=getApifyConfig()){this.available=Boolean(config.token&&config.actorId);}
 async collect(query:string,region:string):Promise<RawSourceData[]>{
  const job:ResearchJob={id:`source-${Date.now()}`,provider:'apify',query,region,actorId:this.config.actorId,status:'running',createdAt:new Date().toISOString(),evidenceCount:0};
  const result=await this.runResearch({query,region,job});
  return result.evidence.map(item=>({id:item.id,sourceId:item.sourceId,source:item.source,sourceType:item.sourceType,sourceUrl:item.sourceUrl,region:item.region,claim:item.claim,originalValue:item.originalValue,metadata:item.metadata,collectedAt:item.collectedAt}));
 }
 private requireToken(){if(!this.config.token)throw new ApifyProviderError('missing_credentials','APIFY_API_TOKEN is not configured.');}
 private async request<T>(path:string,init:RequestInit={},attempt=0):Promise<T>{
  this.requireToken();
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),this.config.timeoutMs);
  try{
   const headers=new Headers(init.headers); headers.set('Accept','application/json'); headers.set('Authorization',`Bearer ${this.config.token}`); if(init.body)headers.set('Content-Type','application/json');
   let response:Response;
   try{response=await fetch(`${this.config.baseUrl}${path}`,{...init,headers,signal:controller.signal});}
   catch(error){if(attempt<this.config.maxRetries){await sleep(retryDelay(attempt));return this.request<T>(path,init,attempt+1);}if((error as Error)?.name==='AbortError')throw new ApifyProviderError('timeout','Apify request timed out.');throw new ApifyProviderError('unavailable','Apify request could not be reached.');}
   if(!response.ok){if(RETRYABLE_STATUS.has(response.status)&&attempt<this.config.maxRetries){await sleep(retryDelay(attempt));return this.request<T>(path,init,attempt+1);}throw errorForStatus(response.status);}
   try{return await response.json() as T;}catch{throw new ApifyProviderError('malformed_response','Apify returned malformed JSON.',response.status);}
  }finally{clearTimeout(timeout);}
 }
 async verifyAuthentication():Promise<ProviderHealth>{
  const checkedAt=new Date().toISOString(); if(!this.config.token)return{provider:'apify',status:'unconfigured',checkedAt,actorConfigured:Boolean(this.config.actorId),message:'APIFY_API_TOKEN is not configured.'};
  const started=Date.now();
  try{await this.request<{data?:unknown}>('/users/me');const actorConfigured=Boolean(this.config.actorId);return{provider:'apify',status:actorConfigured?'healthy':'degraded',checkedAt,latencyMs:Date.now()-started,actorConfigured,message:actorConfigured?'Apify authentication verified.':'Apify authentication verified, but APIFY_ACTOR_ID is not configured.'};}
  catch(error){const providerError=error instanceof ApifyProviderError?error:new ApifyProviderError('unavailable','Apify health check failed.');const status=providerError.code==='invalid_auth'?'unhealthy':'degraded';return{provider:'apify',status,checkedAt,latencyMs:Date.now()-started,actorConfigured:Boolean(this.config.actorId),message:providerError.message};}
 }
 private async startRun(input:ApifyRunInput){
  this.requireToken(); const actorId=input.actorId||this.config.actorId; if(!actorId)throw new ApifyProviderError('unavailable','APIFY_ACTOR_ID is not configured.');
  const actorInput=input.input||{queries:[input.query],searchQuery:input.query,region:input.region};
  const payload=await this.request<{data?:{id?:string;status?:string;defaultDatasetId?:string}}>(`/actors/${encodeURIComponent(actorId)}/runs`,{method:'POST',body:JSON.stringify(actorInput)});
  const run=payload?.data; if(!run?.id)throw new ApifyProviderError('malformed_response','Apify did not return a run ID.');
  return{...run,actorId};
 }
 private async waitForRun(runId:string,initial:{status?:string;defaultDatasetId?:string}){
  let run=initial;
  for(let attempt=0;attempt<this.config.maxPolls;attempt++){
   const status=String(run.status||'').toUpperCase();
   if(['SUCCEEDED','FINISHED'].includes(status))return run;
   if(['FAILED','ABORTED','TIMED-OUT','TIMED_OUT'].includes(status))throw new ApifyProviderError('run_failed',`Apify research run ${status.toLowerCase()}.`);
   await sleep(this.config.pollIntervalMs); const payload=await this.request<{data?:typeof run}>(`/actor-runs/${encodeURIComponent(runId)}`); run=payload?.data||run;
  }
  throw new ApifyProviderError('timeout','Apify research run timed out while waiting for completion.');
 }
 private async datasetItems(datasetId:string){
  const payload=await this.request<unknown[]>(`/datasets/${encodeURIComponent(datasetId)}/items?format=json&clean=true&limit=100`); if(!Array.isArray(payload))throw new ApifyProviderError('malformed_response','Apify dataset response was not an array.'); return payload;
 }
 async runResearch(input:ApifyRunInput):Promise<ApifyRunResult>{
  const startedAt=new Date().toISOString(); const run=await this.startRun(input); const completed=await this.waitForRun(run.id,run); const items=completed.defaultDatasetId?await this.datasetItems(completed.defaultDatasetId):[]; const collectedAt=new Date().toISOString();
  const sourceUrl=`${this.config.baseUrl}/actor-runs/${encodeURIComponent(run.id)}/dataset/items`;
  const evidence=items.map((item,index)=>createEvidence({id:`apify-${run.id}-${index+1}`,claim:`Apify research result for ${input.query}`,source:`Apify actor ${run.actorId}`,sourceType:'search',sourceUrl,sourceId:`${run.id}-${index+1}`,region:input.region,originalValue:JSON.stringify(item),normalizedValue:JSON.stringify(item),collectedAt,status:'unverified',confidence:0,metadata:{provider:'apify',query:input.query,category:'search',tags:['EXTERNAL SOURCE','UNVERIFIED'],notes:'Requires verification before intelligence use.'}}));
  return{runId:run.id,evidence,job:{...input.job,status:'completed',startedAt,completedAt:collectedAt,evidenceCount:evidence.length}};
 }
}

export function createApifyAdapter(config?:ApifyConfig){return new ApifyProviderAdapter(config||getApifyConfig());}
