import type {ProviderHealth} from '../../types';
import type {SerpApiEngine,SerpApiRawResponse,SerpApiSearchRequest,SerpApiHealth} from './types';

const SERPAPI_BASE='https://serpapi.com';
const RETRYABLE=new Set([408,425,429,500,502,503,504]);
export type SerpApiErrorCode='missing_key'|'invalid_key'|'rate_limited'|'quota_exhausted'|'timeout'|'unavailable'|'invalid_response'|'empty_result';
export class SerpApiError extends Error{constructor(public readonly code:SerpApiErrorCode,message:string,public readonly status?:number){super(message);this.name='SerpApiError';}}
export interface SerpApiConfig{apiKey?:string;baseUrl:string;timeoutMs:number;maxRetries:number;}
const positiveInt=(value:string|undefined,fallback:number)=>{const parsed=Number(value);return Number.isFinite(parsed)&&parsed>0?Math.floor(parsed):fallback;};
export function getSerpApiConfig(env:NodeJS.ProcessEnv=process.env):SerpApiConfig{return{apiKey:env.SERPAPI_KEY?.trim()||undefined,baseUrl:(env.SERPAPI_BASE_URL||SERPAPI_BASE).replace(/\/$/,''),timeoutMs:positiveInt(env.SERPAPI_TIMEOUT_MS,15000),maxRetries:Math.min(3,positiveInt(env.SERPAPI_MAX_RETRIES,2))};}
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
const retryDelay=(attempt:number)=>Math.min(5000,250*2**attempt);
const statusError=(status:number)=>status===401||status===403?new SerpApiError('invalid_key','SerpApi authentication was rejected.',status):status===429?new SerpApiError('rate_limited','SerpApi rate limit reached.',status):new SerpApiError('unavailable',`SerpApi request failed with status ${status}.`,status);
function classifyApiError(message:string){const lower=message.toLowerCase();if(lower.includes('api key')||lower.includes('private key')||lower.includes('invalid'))return'invalid_key' as const;if(lower.includes('limit')||lower.includes('credit')||lower.includes('quota'))return'quota_exhausted' as const;return'unavailable' as const;}

export class SerpApiClient{
 constructor(public readonly config:SerpApiConfig=getSerpApiConfig()){}
 private requireKey(){if(!this.config.apiKey)throw new SerpApiError('missing_key','SERPAPI_KEY is not configured.');}
 private async request<T>(path:string,params:Record<string,string|number|boolean|undefined>,attempt=0):Promise<{data:T;latencyMs:number}>{
  this.requireKey();const url=new URL(`${this.config.baseUrl}${path}`);Object.entries({...params,api_key:this.config.apiKey,output:'json'}).forEach(([key,value])=>{if(value!==undefined)url.searchParams.set(key,String(value));});const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),this.config.timeoutMs);const started=Date.now();
  try{let response:Response;try{response=await fetch(url.toString(),{headers:{Accept:'application/json'},signal:controller.signal});}catch(error){if(attempt<this.config.maxRetries){await sleep(retryDelay(attempt));return this.request<T>(path,params,attempt+1);}if((error as Error)?.name==='AbortError')throw new SerpApiError('timeout','SerpApi request timed out.');throw new SerpApiError('unavailable','SerpApi could not be reached.');}
   if(!response.ok){if(RETRYABLE.has(response.status)&&attempt<this.config.maxRetries){await sleep(retryDelay(attempt));return this.request<T>(path,params,attempt+1);}throw statusError(response.status);}
   let data:T;try{data=await response.json() as T;}catch{throw new SerpApiError('invalid_response','SerpApi returned malformed JSON.',response.status);}return{data,latencyMs:Date.now()-started};
  }finally{clearTimeout(timeout);}
 }
 async search(request:SerpApiSearchRequest){
  const response=await this.request<SerpApiRawResponse>('/search.json',{engine:request.engine||'google',q:request.query,location:request.location||request.region,gl:request.country,hl:request.language,start:request.start,num:request.num,no_cache:request.noCache});
  if(response.data.error)throw new SerpApiError(classifyApiError(response.data.error),response.data.error);
  return{data:response.data,latencyMs:response.latencyMs};
 }
 async verifyAuthentication():Promise<SerpApiHealth>{
  const checkedAt=new Date().toISOString();if(!this.config.apiKey)return{provider:'serpapi',status:'unconfigured',checkedAt,actorConfigured:false,message:'SERPAPI_KEY is not configured.',requestCount:0,lastSuccessfulResearch:null,lastError:null};
  const started=Date.now();try{await this.request<Record<string,unknown>>('/account.json',{});return{provider:'serpapi',status:'healthy',checkedAt,latencyMs:Date.now()-started,actorConfigured:true,message:'SerpApi authentication verified.',requestCount:0,lastSuccessfulResearch:null,lastError:null};}catch(error){const apiError=error instanceof SerpApiError?error:new SerpApiError('unavailable','SerpApi health check failed.');const status=apiError.code==='rate_limited'?'rate-limited':apiError.code==='invalid_key'?'unhealthy':'degraded';return{provider:'serpapi',status,checkedAt,latencyMs:Date.now()-started,actorConfigured:true,message:apiError.message,requestCount:0,lastSuccessfulResearch:null,lastError:apiError.message};}
 }
}
