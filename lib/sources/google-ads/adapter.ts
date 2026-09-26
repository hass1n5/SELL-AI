import type {ProviderHealth} from '../../types';
import type {RawSourceData,SourceAdapter} from '../registry';
import {GoogleAdsClient,getGoogleAdsConfig} from './client';
import {buildKeywordIdeasRequest,normalizeKeywordIdeas} from './keyword-planner';
import {getGoogleAdsUsageSummary,recordGoogleAdsUsage} from './usage';
import {GoogleAdsProviderError} from './types';
import type {GoogleAdsHealth,GoogleAdsKeywordRequest,GoogleAdsKeywordResult} from './types';

export class GoogleAdsProviderAdapter implements SourceAdapter{
 readonly id='google-ads';readonly name='Google Ads';readonly type='ads' as const;readonly available:boolean;
 constructor(public readonly client=new GoogleAdsClient()){this.available=Boolean(client.config.clientId&&client.config.clientSecret&&client.config.refreshToken&&client.config.customerId);}
 async research(request:GoogleAdsKeywordRequest):Promise<GoogleAdsKeywordResult>{const normalized=buildKeywordIdeasRequest(request);const requestId=`google-ads-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;const started=Date.now();try{const raw=await this.client.generateKeywordIdeas(normalized);const result=normalizeKeywordIdeas(raw,normalized,requestId);result.latencyMs=Date.now()-started;recordGoogleAdsUsage({requestId,timestamp:new Date().toISOString(),query:result.query,location:result.location,success:true,latencyMs:result.latencyMs,keywordCount:result.keywords.length});return result;}catch(error){const providerError=error instanceof GoogleAdsProviderError?error:new GoogleAdsProviderError('unavailable','Google Ads keyword research failed.');recordGoogleAdsUsage({requestId,timestamp:new Date().toISOString(),query:normalized.query||normalized.seedKeywords?.join(', ')||normalized.seedUrl||'',location:normalized.location||'Unspecified',success:false,latencyMs:Date.now()-started,keywordCount:0,errorCode:providerError.code});throw providerError;}}
 async collect(query:string,region:string):Promise<RawSourceData[]>{const result=await this.research({query,location:region});return result.evidence.map(item=>({id:item.id,sourceId:item.sourceId,source:item.source,sourceType:item.sourceType,sourceUrl:item.sourceUrl,region:item.region,claim:item.claim,originalValue:item.originalValue,metadata:item.metadata,collectedAt:item.collectedAt}));}
 async verifyAuthentication():Promise<GoogleAdsHealth>{const health=await this.client.verifyAuthentication();const usage=getGoogleAdsUsageSummary();return{...health,requestCount:usage.requestCount,lastSuccessfulResearch:usage.lastSuccessfulResearch,lastError:usage.lastError};}
}
export function createGoogleAdsAdapter(){return new GoogleAdsProviderAdapter(new GoogleAdsClient(getGoogleAdsConfig()));}
