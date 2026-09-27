import {createEvidence,verifyEvidence} from '../../evidence';
import type {EvidenceItem,SourceType,VerificationReport} from '../../types';
import type {MetaPage,MetaAdAccount,MetaCampaign,MetaAdSet,MetaAd,MetaInsight,MetaCatalog,MetaProductSet,MetaProductItem,MetaInstagramAccount,MetaInstagramMedia} from './types';
import type {AdIntelligence} from './insights';

const sourceUrl=(reference:string)=>`https://graph.facebook.com/${reference.replace(/^\//,'')}`;
const json=(value:unknown)=>JSON.stringify(value);
const evidence=(id:string,claim:string,sourceType:SourceType,sourceId:string,originalValue:unknown,normalizedValue:string,region:string,collectedAt:string,confidence=.75)=>createEvidence({id,claim,source:'Meta Graph API',sourceType,sourceUrl:sourceUrl(sourceId),sourceId,region,originalValue:json(originalValue),normalizedValue,collectedAt,status:'unverified',confidence,metadata:{provider:'meta',category:sourceType,tags:['META','EXTERNAL SOURCE','UNVERIFIED'],notes:'Meta API data is factual evidence; missing metrics remain unavailable.'}},new Date(collectedAt));

export function normalizeMetaPages(items:MetaPage[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.flatMap(item=>[
    evidence(`meta-page-${item.id}`,`Meta Facebook Page: ${item.name||item.id}`,'social',item.id,item,JSON.stringify({id:item.id,name:item.name,category:item.category,link:item.link}),region,collectedAt,.8),
    ...(item.followersCount===null||item.followersCount===undefined?[]:[evidence(`meta-page-${item.id}-followers`,`Meta Page followers for ${item.name||item.id}`,'social',`${item.id}/followers_count`,item.followersCount,String(item.followersCount),region,collectedAt,.75)])
  ]);
}

export function normalizeMetaAdAccounts(items:MetaAdAccount[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.map(item=>evidence(`meta-ad-account-${item.id}`,`Meta ad account: ${item.name||item.id}`,'ads',`act_${item.id}`,item,JSON.stringify({id:item.id,name:item.name,status:item.accountStatus,currency:item.currency,timezone:item.timezoneName}),region,collectedAt,.8));
}

export function normalizeMetaAds(accounts:MetaAdAccount[],campaigns:MetaCampaign[],adSets:MetaAdSet[],ads:MetaAd[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  const accountEvidence=normalizeMetaAdAccounts(accounts,region,collectedAt);
  const campaignEvidence=campaigns.map(item=>evidence(`meta-campaign-${item.id}`,`Meta campaign: ${item.name||item.id}`,'ads',item.id,item,JSON.stringify({id:item.id,name:item.name,status:item.effectiveStatus||item.status}),region,collectedAt,.75));
  const setEvidence=adSets.map(item=>evidence(`meta-adset-${item.id}`,`Meta ad set: ${item.name||item.id}`,'ads',item.id,item,JSON.stringify({id:item.id,name:item.name,status:item.status,campaignId:item.campaignId}),region,collectedAt,.75));
  const adEvidence=ads.map(item=>evidence(`meta-ad-${item.id}`,`Meta ad: ${item.name||item.id}`,'ads',item.id,item,JSON.stringify({id:item.id,name:item.name,status:item.status,adSetId:item.adSetId,creative:item.creative||null}),region,collectedAt,.75));
  return[...accountEvidence,...campaignEvidence,...setEvidence,...adEvidence];
}

export function normalizeMetaInsights(items:MetaInsight[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.flatMap(item=>Object.entries(item.metrics).filter(([,value])=>value!==null&&value!==undefined&&value!=='').map(([metric,value])=>{
    const subject=item.adId||item.adSetId||item.campaignId||item.accountId||'account';
    return evidence(`meta-insight-${subject}-${metric}-${item.dateStart||'range'}`,`Meta Ads ${metric} for ${subject}`,'ads',`${subject}/insights`,value,String(value),region,collectedAt,.8);
  }));
}

export function normalizeMetaInstagram(account:MetaInstagramAccount,region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return[evidence(`meta-instagram-${account.id}`,`Meta Instagram Professional account: ${account.username||account.name||account.id}`,'social',account.id,account,JSON.stringify({id:account.id,username:account.username,name:account.name,followersCount:account.followersCount,mediaCount:account.mediaCount}),region,collectedAt,.8)];
}

export function normalizeMetaInstagramMedia(items:MetaInstagramMedia[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.map(item=>evidence(`meta-instagram-media-${item.id}`,`Meta Instagram media: ${item.id}`,'social',item.id,item,JSON.stringify({id:item.id,mediaType:item.mediaType,permalink:item.permalink,timestamp:item.timestamp,likes:item.likeCount,comments:item.commentsCount}),region,collectedAt,.7));
}

export function normalizeMetaCatalogs(items:MetaCatalog[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.map(item=>evidence(`meta-catalog-${item.id}`,`Meta product catalog: ${item.name||item.id}`,'marketplace',item.id,item,JSON.stringify({id:item.id,name:item.name,productCount:item.productCount}),region,collectedAt,.75));
}

export function normalizeMetaProductSets(items:MetaProductSet[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.map(item=>evidence(`meta-product-set-${item.id}`,`Meta product set: ${item.name||item.id}`,'marketplace',item.id,item,JSON.stringify({id:item.id,name:item.name,productCount:item.productCount}),region,collectedAt,.7));
}

export function normalizeMetaProductItems(items:MetaProductItem[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.map(item=>evidence(`meta-product-${item.id}`,`Meta catalog product: ${item.name||item.id}`,'marketplace',item.id,item,JSON.stringify({id:item.id,name:item.name,availability:item.availability,price:item.price,url:item.url}),region,collectedAt,.75));
}

export function normalizeAdIntelligence(items:AdIntelligence[],region='Global',collectedAt=new Date().toISOString()):EvidenceItem[]{
  return items.flatMap(item=>Object.entries(item.metrics).filter(([,value])=>value!==null&&value!==undefined&&value!=='').map(([metric,value])=>evidence(`meta-ad-intelligence-${item.ad?.id||item.campaign?.id||item.accountId}-${metric}`,`Meta ad ${metric} for ${item.ad?.name||item.ad?.id||item.campaign?.name||item.accountId||'account'}`,'ads',item.ad?.id||item.campaign?.id||item.accountId||'insights',value,String(value),region,collectedAt,.8)));
}

export function verifyMetaEvidence(records:EvidenceItem[]):VerificationReport{return verifyEvidence(records);}
