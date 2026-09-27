import type {EvidenceItem} from '../../types';
import {MetaClient,getMetaConfig} from './client';
import {discoverMetaPages} from './auth';
import {listPages} from './pages';
import {listAdAccounts,researchAds} from './ads';
import {discoverInstagramAccount,listInstagramMedia} from './instagram';
import {listCatalogs,listProductItems,listProductSets} from './catalog';
import {researchAdLibrary} from './ad-library';
import {buildAdIntelligence} from './insights';
import {normalizeAdIntelligence,normalizeMetaAdAccounts,normalizeMetaAds,normalizeMetaCatalogs,normalizeMetaInstagram,normalizeMetaInstagramMedia,normalizeMetaInsights,normalizeMetaPages,normalizeMetaProductItems,normalizeMetaProductSets,verifyMetaEvidence} from './normalizer';
import {MetaProviderError} from './types';
import type {MetaCapabilityHealth,MetaCapabilityKey,MetaConfig,MetaHealth,MetaResearchRequest,MetaResearchResult} from './types';

const capabilityFrom=(capability:MetaCapabilityKey,error:unknown,checkedAt:string):MetaCapabilityHealth=>{
  const providerError=error instanceof MetaProviderError?error:new MetaProviderError('unavailable','Meta capability is unavailable.');
  const status=providerError.code==='rate_limited'?'rate_limited':providerError.code==='invalid_auth'||providerError.code==='expired_token'?'auth_error':providerError.code==='permission_denied'||providerError.code==='app_review_required'?'permission_error':providerError.code==='missing_token'?'not_connected':'unavailable';
  return{capability,status,message:providerError.message,checkedAt,lastError:providerError.code};
};

const emptyCapability=(capability:MetaCapabilityKey,message:string,checkedAt:string):MetaCapabilityHealth=>({capability,status:'not_connected',message,checkedAt});

export class MetaProviderAdapter{
  readonly client:MetaClient;
  constructor(config:MetaConfig=getMetaConfig()){this.client=new MetaClient(config);}
  get config(){return this.client.config;}
  get available(){return Boolean(this.config.accessToken);}

  async verifyAuthentication():Promise<MetaHealth>{
    const health=await this.client.verifyAuthentication();
    if(!this.available)return health;
    const checkedAt=new Date().toISOString();
    const capabilities={...health.capabilities};
    let pages:Awaited<ReturnType<typeof listPages>>=[];
    try{pages=await listPages(this.client);capabilities.facebook={capability:'facebook',status:'connected',message:'Facebook Pages are accessible.',checkedAt,count:pages.length};}
    catch(error){capabilities.facebook=capabilityFrom('facebook',error,checkedAt);}
    try{const accounts=await listAdAccounts(this.client);capabilities.ads={capability:'ads',status:'connected',message:'Meta ad accounts are accessible.',checkedAt,count:accounts.length};}
    catch(error){capabilities.ads=capabilityFrom('ads',error,checkedAt);}
    try{const instagram=await discoverInstagramAccount(this.client,this.config.pageId,this.config.instagramAccountId);capabilities.instagram={capability:'instagram',status:'connected',message:'Instagram Professional account is accessible.',checkedAt,count:1};void instagram;}
    catch(error){capabilities.instagram=capabilityFrom('instagram',error,checkedAt);}
    try{const catalogs=await listCatalogs(this.client,this.config.businessId);capabilities.catalog={capability:'catalog',status:'connected',message:'Meta product catalogs are accessible.',checkedAt,count:catalogs.length};}
    catch(error){capabilities.catalog=capabilityFrom('catalog',error,checkedAt);}
    capabilities.adLibrary=emptyCapability('adLibrary','Ad Library availability depends on app permissions and regional support.',checkedAt);
    const connectedCount=Object.values(capabilities).filter(item=>item.status==='connected').length;
    const status=health.status==='rate-limited'?'rate-limited':health.status==='unhealthy'?'unhealthy':connectedCount?'healthy':'degraded';
    return{...health,status,capabilities,message:status==='healthy'?'Meta authentication and available capabilities verified.':health.message};
  }

  async getMe(){return this.client.getMe();}
  async getPages(){return listPages(this.client);}
  async getAdAccounts(){return listAdAccounts(this.client);}
  async getInstagram(){return discoverInstagramAccount(this.client,this.config.pageId,this.config.instagramAccountId);}
  async getCatalogs(){return listCatalogs(this.client,this.config.businessId);}

  async research(request:MetaResearchRequest):Promise<MetaResearchResult>{
    const started=Date.now(); const collectedAt=new Date().toISOString(); const region=request.region?.trim()||'Global'; let evidence:EvidenceItem[]=[]; let data:Record<string,unknown>={};
    switch(request.capability){
      case 'pages':{const pages=await listPages(this.client);evidence=normalizeMetaPages(pages,region,collectedAt);data={pages};break;}
      case 'instagram':{const account=await discoverInstagramAccount(this.client,request.pageId||this.config.pageId,this.config.instagramAccountId);const media=await listInstagramMedia(this.client,account.id);evidence=[...normalizeMetaInstagram(account,region,collectedAt),...normalizeMetaInstagramMedia(media,region,collectedAt)];data={account,media};break;}
      case 'ads':{let accountId=(request.accountId||this.config.adAccountId||'').replace(/^act_/i,'');if(!accountId){const accounts=await listAdAccounts(this.client);accountId=accounts[0]?.id||'';}if(!accountId)throw new MetaProviderError('unavailable','No accessible Meta ad account was found.');const result=await researchAds(this.client,accountId,{dateStart:request.dateStart,dateEnd:request.dateEnd,level:'ad'});const intelligence=buildAdIntelligence(result.accounts,result.campaigns,result.adSets,result.ads,result.insights,collectedAt);evidence=[...normalizeMetaAds(result.accounts,result.campaigns,result.adSets,result.ads,region,collectedAt),...normalizeMetaInsights(result.insights,region,collectedAt),...normalizeAdIntelligence(intelligence,region,collectedAt)];data={...result,intelligence};break;}
      case 'catalog':{const catalogs=await listCatalogs(this.client,this.config.businessId);let productSets:Awaited<ReturnType<typeof listProductSets>>=[];let products:Awaited<ReturnType<typeof listProductItems>>=[];const catalogId=request.catalogId||catalogs[0]?.id;if(catalogId){productSets=await listProductSets(this.client,catalogId);if(request.productSetId)products=await listProductItems(this.client,request.productSetId);}evidence=[...normalizeMetaCatalogs(catalogs,region,collectedAt),...normalizeMetaProductSets(productSets,region,collectedAt),...normalizeMetaProductItems(products,region,collectedAt)];data={catalogs,productSets,products};break;}
      case 'ad-library':{const ads=await researchAdLibrary(this.client,{query:request.query||'',region,dateStart:request.dateStart,dateEnd:request.dateEnd,pageId:request.pageId});evidence=ads.map(item=>({id:`meta-ad-library-${item.id}`,claim:`Meta Ad Library result: ${item.pageName||item.id}`,source:'Meta Ad Library',sourceType:'ads',sourceUrl:item.adSnapshotUrl||`https://www.facebook.com/ads/library/?id=${encodeURIComponent(item.id)}`,sourceId:item.id,region,originalValue:JSON.stringify(item),normalizedValue:JSON.stringify({id:item.id,pageId:item.pageId,pageName:item.pageName,body:item.adCreativeBody,title:item.adCreativeLinkTitle,created:item.adCreationTime}),collectedAt,timestamp:collectedAt,freshnessHours:0,freshness:'fresh',status:'unverified',verificationStatus:'unverified',confidence:.65,metadata:{provider:'meta',category:'ad-library',tags:['META AD LIBRARY','RESEARCH EVIDENCE'],notes:'Ad Library presence is not sales proof.'}}));data={ads};break;}
    }
    const verification=verifyMetaEvidence(evidence); evidence=verification.verified;
    return{capability:request.capability,evidence,verification,sourceStatus:evidence.length?'success':'empty',collectedAt,latencyMs:Date.now()-started,counts:{evidence:evidence.length},data};
  }
}

export function createMetaAdapter(config:MetaConfig=getMetaConfig()){return new MetaProviderAdapter(config);}
export * from './types';
export * from './client';
export * from './auth';
export * from './pages';
export * from './ads';
export * from './insights';
export * from './instagram';
export * from './catalog';
export * from './normalizer';
export * from './ad-library';
