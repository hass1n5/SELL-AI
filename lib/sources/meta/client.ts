import type {MetaConfig,MetaHealth,MetaUser,MetaPage,MetaProviderError,MetaErrorCode} from './types';
import {MetaProviderError as ProviderError} from './types';

const DEFAULT_GRAPH_BASE='https://graph.facebook.com';
const RETRYABLE=new Set([408,425,429,500,502,503,504]);
const positive=(value:string|undefined,fallback:number)=>{const parsed=Number(value);return Number.isFinite(parsed)&&parsed>0?Math.floor(parsed):fallback;};
const trim=(value:string|undefined)=>value?.trim()||undefined;
const cleanId=(value:string|undefined)=>value?.trim().replace(/^act_/i,'')||undefined;

export function getMetaConfig(env:Record<string,string|undefined>=process.env):MetaConfig{
  return{
    accessToken:trim(env.META_ACCESS_TOKEN),
    appId:trim(env.META_APP_ID),
    appSecret:trim(env.META_APP_SECRET),
    businessId:trim(env.META_BUSINESS_ID),
    adAccountId:cleanId(env.META_AD_ACCOUNT_ID),
    pageId:trim(env.META_PAGE_ID),
    instagramAccountId:trim(env.META_INSTAGRAM_ACCOUNT_ID),
    baseUrl:(env.META_GRAPH_BASE_URL||DEFAULT_GRAPH_BASE).replace(/\/$/,''),
    apiVersion:(env.META_GRAPH_API_VERSION||'v22.0').replace(/^\//,'').replace(/\/$/,''),
    timeoutMs:positive(env.META_TIMEOUT_MS,15000),
    maxRetries:Math.min(3,positive(env.META_MAX_RETRIES,2))
  };
}

export function validateMetaConfig(config:MetaConfig){
  return config.accessToken?null:'META_ACCESS_TOKEN is not configured.';
}

const delay=(attempt:number)=>new Promise<void>(resolve=>setTimeout(resolve,Math.min(4000,250*2**attempt)));
const safeMessage=(value:string)=>value.replace(/access_token=[^&\s]+/gi,'access_token=[redacted]').slice(0,300);

function errorFromStatus(status:number,message?:string){
  const text=message||`Meta Graph API request failed with status ${status}.`;
  if(status===401)return new ProviderError('invalid_auth','Meta access token was rejected.',status);
  if(status===403)return new ProviderError('permission_denied','Meta permission was denied for this capability.',status);
  if(status===429)return new ProviderError('rate_limited','Meta API rate limit reached.',status);
  if(status===400)return new ProviderError('unavailable',safeMessage(text),status);
  return new ProviderError('unavailable',safeMessage(text),status);
}

export interface MetaGraphResponse<T>{data?:T[];paging?:{next?:string;previous?:string};summary?:Record<string,unknown>;[key:string]:unknown;}

export class MetaClient{
  constructor(public readonly config:MetaConfig=getMetaConfig()){}

  private requireToken(){const message=validateMetaConfig(this.config);if(message)throw new ProviderError('missing_token',message);}
  private base(){const versioned=/\/v\d+(?:\.\d+)?$/i.test(this.config.baseUrl);return versioned?this.config.baseUrl:`${this.config.baseUrl}/${this.config.apiVersion}`;}

  async get<T=Record<string,unknown>>(path:string,params:Record<string,string|number|boolean|undefined>={},attempt=0):Promise<T>{
    this.requireToken();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),this.config.timeoutMs);
    try{
      const url=new URL(`${this.base()}${path.startsWith('/')?path:`/${path}`}`);
      Object.entries({...params,access_token:this.config.accessToken}).forEach(([key,value])=>{if(value!==undefined&&value!==null)url.searchParams.set(key,String(value));});
      let response:Response;
      try{response=await fetch(url,{method:'GET',headers:{Accept:'application/json'},signal:controller.signal});}
      catch(error){
        if((error as Error)?.name==='AbortError')throw new ProviderError('timeout','Meta API request timed out.');
        if(attempt<this.config.maxRetries){await delay(attempt);return this.get<T>(path,params,attempt+1);}
        throw new ProviderError('unavailable','Meta API could not be reached.');
      }
      let payload:Record<string,unknown>|null=null;
      try{payload=await response.json() as Record<string,unknown>;}catch{if(!response.ok)throw errorFromStatus(response.status);throw new ProviderError('malformed_response','Meta API returned malformed JSON.',response.status);}
      if(!response.ok){
        const apiError=(payload?.error||{}) as Record<string,unknown>;
        const code=String(apiError.code||'');
        const type=String(apiError.type||'');
        const message=String(apiError.message||'');
        if((code==='190'||type==='OAuthException')&&/expired|session/i.test(message))throw new ProviderError('expired_token','Meta access token has expired.',response.status);
        if(RETRYABLE.has(response.status)&&attempt<this.config.maxRetries){await delay(attempt);return this.get<T>(path,params,attempt+1);}
        throw errorFromStatus(response.status,message);
      }
      return payload as T;
    }finally{clearTimeout(timer);}
  }

  async getMe():Promise<MetaUser>{
    const data=await this.get<{id?:string;name?:string}>('/me',{fields:'id,name'});
    if(!data?.id)throw new ProviderError('malformed_response','Meta /me response did not include a user id.');
    return{id:String(data.id),name:typeof data.name==='string'?data.name:undefined};
  }

  async getPages():Promise<MetaGraphResponse<Record<string,unknown>>>{
    return this.get('/me/accounts',{fields:'id,name,category,link,fan_count,followers_count',limit:100});
  }

  async getAdAccounts():Promise<MetaGraphResponse<Record<string,unknown>>>{
    return this.get('/me/adaccounts',{fields:'id,name,account_status,currency,timezone_name,amount_spent',limit:100});
  }

  async verifyAuthentication():Promise<MetaHealth>{
    const checkedAt=new Date().toISOString();
    const empty=(capability:'facebook'|'instagram'|'ads'|'catalog'|'adLibrary',message:string):MetaHealth['capabilities'][typeof capability]=>({capability,status:'not_connected',message,checkedAt});
    const capabilities={facebook:empty('facebook','Meta access token is not configured.'),instagram:empty('instagram','Instagram discovery has not been checked.'),ads:empty('ads','Ads discovery has not been checked.'),catalog:empty('catalog','Catalog discovery has not been checked.'),adLibrary:empty('adLibrary','Ad Library requires a separate supported research route.')};
    const base:MetaHealth={provider:'meta',status:'unconfigured',checkedAt,message:'Meta access token is not configured.',requestCount:0,lastSuccessfulResearch:null,lastError:null,capabilities};
    if(!this.config.accessToken)return base;
    const started=Date.now();
    try{const user=await this.getMe();return{...base,status:'healthy',latencyMs:Date.now()-started,userId:user.id,userName:user.name,message:'Meta authentication verified.',capabilities:{...capabilities,facebook:{capability:'facebook',status:'connected',message:'Meta user authentication verified.',checkedAt,latencyMs:Date.now()-started}}};}
    catch(error){
      const providerError=error instanceof ProviderError?error:new ProviderError('unavailable','Meta authentication check failed.');
      const status=providerError.code==='rate_limited'?'rate-limited':providerError.code==='missing_token'?'unconfigured':providerError.code==='invalid_auth'||providerError.code==='expired_token'||providerError.code==='permission_denied'?'unhealthy':'degraded';
      return{...base,status,latencyMs:Date.now()-started,message:providerError.message,lastError:providerError.code,capabilities:{...capabilities,facebook:{capability:'facebook',status:providerError.code==='permission_denied'?'permission_error':'auth_error',message:providerError.message,checkedAt,lastError:providerError.code}}};
    }
  }
}

export type {MetaProviderError,MetaErrorCode};
