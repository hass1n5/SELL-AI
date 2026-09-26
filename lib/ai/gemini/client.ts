import type {GeminiApiResponse,GeminiConfig,GeminiStatus} from './types';

const GEMINI_API_BASE='https://generativelanguage.googleapis.com';
const RETRYABLE_STATUS=new Set([408,425,429,500,502,503,504]);
export type GeminiErrorCode='missing_key'|'invalid_key'|'rate_limited'|'quota_exceeded'|'timeout'|'unavailable'|'malformed_json'|'invalid_response';
export class GeminiProviderError extends Error{constructor(public readonly code:GeminiErrorCode,message:string,public readonly status?:number){super(message);this.name='GeminiProviderError';}}
const positiveInt=(value:string|undefined,fallback:number)=>{const parsed=Number(value);return Number.isFinite(parsed)&&parsed>0?Math.floor(parsed):fallback;};
export function getGeminiConfig(env:NodeJS.ProcessEnv=process.env):GeminiConfig{return{apiKey:env.GEMINI_API_KEY?.trim()||undefined,model:(env.GEMINI_MODEL||'gemini-2.5-flash').trim(),baseUrl:(env.GEMINI_API_BASE_URL||GEMINI_API_BASE).replace(/\/$/,''),timeoutMs:positiveInt(env.GEMINI_TIMEOUT_MS,20000),maxRetries:Math.min(3,positiveInt(env.GEMINI_MAX_RETRIES,1))};}
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
const retryDelay=(attempt:number)=>Math.min(4000,250*2**attempt);
function statusError(status:number){if(status===401||status===403)return new GeminiProviderError('invalid_key','Gemini authentication was rejected.',status);if(status===429)return new GeminiProviderError('rate_limited','Gemini rate limit reached.',status);if(status===402||status===409)return new GeminiProviderError('quota_exceeded','Gemini quota is unavailable.',status);return new GeminiProviderError('unavailable',`Gemini request failed with status ${status}.`,status);}

export class GeminiClient{
 constructor(public readonly config:GeminiConfig=getGeminiConfig()){}
 private requireKey(){if(!this.config.apiKey)throw new GeminiProviderError('missing_key','Gemini Not Connected');}
 private async request<T>(path:string,init:RequestInit={},attempt=0):Promise<T>{
  this.requireKey(); const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),this.config.timeoutMs);
  try{
   const headers=new Headers(init.headers);headers.set('Content-Type','application/json');headers.set('Accept','application/json');headers.set('x-goog-api-key',this.config.apiKey as string);
   let response:Response;
   try{response=await fetch(`${this.config.baseUrl}${path}`,{...init,headers,signal:controller.signal});}
   catch(error){if(attempt<this.config.maxRetries){await sleep(retryDelay(attempt));return this.request<T>(path,init,attempt+1);}if((error as Error)?.name==='AbortError')throw new GeminiProviderError('timeout','Gemini request timed out.');throw new GeminiProviderError('unavailable','Gemini API could not be reached.');}
   if(!response.ok){if(RETRYABLE_STATUS.has(response.status)&&attempt<this.config.maxRetries){await sleep(retryDelay(attempt));return this.request<T>(path,init,attempt+1);}throw statusError(response.status);}
   try{return await response.json() as T;}catch{throw new GeminiProviderError('malformed_json','Gemini returned malformed JSON.',response.status);}
  }finally{clearTimeout(timeout);}
 }
 async verifyAuthentication():Promise<GeminiStatus>{
  if(!this.config.apiKey)return{status:'NOT CONNECTED',model:this.config.model,lastAnalysisTime:null,evidenceAnalyzed:0,evidenceExcluded:0,usageCount:0,message:'Gemini Not Connected'};
  try{await this.request('/v1beta/models?pageSize=1');return{status:'CONNECTED',model:this.config.model,lastAnalysisTime:null,evidenceAnalyzed:0,evidenceExcluded:0,usageCount:0,message:'Gemini authentication verified.'};}
  catch(error){const providerError=error instanceof GeminiProviderError?error:new GeminiProviderError('unavailable','Gemini status check failed.');return{status:'NOT CONNECTED',model:this.config.model,lastAnalysisTime:null,evidenceAnalyzed:0,evidenceExcluded:0,usageCount:0,message:providerError.message};}
 }
 async generateContent(prompt:string,responseSchema:Record<string,unknown>):Promise<{data:GeminiApiResponse;inputTokens:number|null;outputTokens:number|null}>{
  const response=await this.request<GeminiApiResponse>(`/v1beta/models/${encodeURIComponent(this.config.model)}:generateContent`,{method:'POST',body:JSON.stringify({systemInstruction:{parts:[{text:'You are an evidence-bound analyst. Follow the supplied system and user instructions.'}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema}})});
  const candidate=response?.candidates?.[0];if(!candidate?.content?.parts?.length)throw new GeminiProviderError('invalid_response','Gemini returned no candidate content.');
  return{data:response,inputTokens:response.usageMetadata?.promptTokenCount??null,outputTokens:response.usageMetadata?.candidatesTokenCount??null};
 }
}
