import type {ProviderHealth} from '../../types';
import type {RawSourceData,SourceAdapter} from '../registry';
import {getSerpApiUsageSummary,recordSerpApiUsage} from './usage';
import {getCachedSerpApiResult,setCachedSerpApiResult} from './cache';
import {SerpApiClient,SerpApiError,getSerpApiConfig} from './client';
import {normalizeSerpApiResponse} from './normalizer';
import type {SerpApiHealth,SerpApiResearchResult,SerpApiSearchRequest} from './types';

export class SerpApiProviderAdapter implements SourceAdapter{
 readonly id='serpapi';readonly name='SerpApi';readonly type='search' as const;readonly available:boolean;
 constructor(public readonly client=new SerpApiClient()){this.available=Boolean(client.config.apiKey);}
 async research(request:SerpApiSearchRequest):Promise<SerpApiResearchResult>{
  const normalizedRequest={...request,query:request.query.trim(),engine:request.engine||'google'};if(!normalizedRequest.query)throw new SerpApiError('invalid_response','Search query is required.');const region=normalizedRequest.region||normalizedRequest.location||'Unspecified';
  if(!normalizedRequest.noCache){const cached=getCachedSerpApiResult(normalizedRequest.query,region,normalizedRequest.engine);if(cached)return cached;}
  const requestId=`serpapi-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;const started=Date.now();try{const response=await this.client.search({...normalizedRequest,region});const base=normalizeSerpApiResponse(response.data,{...normalizedRequest,region});const result:SerpApiResearchResult={...base,cacheHit:false,cacheAgeHours:null,latencyMs:response.latencyMs,requestId};setCachedSerpApiResult(base);recordSerpApiUsage({requestId,timestamp:new Date().toISOString(),query:normalizedRequest.query,region,engine:normalizedRequest.engine,success:true,latencyMs:Date.now()-started,resultCount:base.rawCount});return result;}catch(error){const apiError=error instanceof SerpApiError?error:new SerpApiError('unavailable','SerpApi research failed.');recordSerpApiUsage({requestId,timestamp:new Date().toISOString(),query:normalizedRequest.query,region,engine:normalizedRequest.engine,success:false,latencyMs:Date.now()-started,resultCount:0,errorCode:apiError.code});throw apiError;}
 }
 async collect(query:string,region:string):Promise<RawSourceData[]>{const result=await this.research({query,region,engine:'google'});return result.evidence.map(item=>({id:item.id,sourceId:item.sourceId,source:item.source,sourceType:item.sourceType,sourceUrl:item.sourceUrl,region:item.region,claim:item.claim,originalValue:item.originalValue,metadata:item.metadata,collectedAt:item.collectedAt}));}
 async verifyAuthentication():Promise<SerpApiHealth>{const health=await this.client.verifyAuthentication();const usage=getSerpApiUsageSummary();return{...health,requestCount:usage.requestCount,lastSuccessfulResearch:usage.lastSuccessfulResearch,lastError:usage.lastError};}
}
export function createSerpApiAdapter(){return new SerpApiProviderAdapter(new SerpApiClient(getSerpApiConfig()));}
