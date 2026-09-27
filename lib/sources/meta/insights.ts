import type {MetaAd,MetaAdAccount,MetaAdSet,MetaCampaign,MetaCreative,MetaInsight} from './types';

export interface AdIntelligence{
  accountId?:string;
  campaign?:{id:string;name?:string;status?:string};
  adSet?:{id:string;name?:string;status?:string};
  ad?:{id:string;name?:string;status?:string};
  creative?:MetaCreative;
  platform:'meta';
  deliveryStatus?:string;
  dateRange?:{start?:string;end?:string};
  metrics:Record<string,number|string|null>;
  source:'Meta Marketing API';
  collectedAt:string;
  evidenceIds:string[];
}

const creativeFrom=(ad:MetaAd|undefined):MetaCreative|undefined=>{
  if(!ad?.creative)return undefined;
  const raw=ad.creative;
  return{
    id:typeof raw.id==='string'?raw.id:undefined,
    type:typeof raw.object_type==='string'?raw.object_type:undefined,
    body:typeof raw.body==='string'?raw.body:undefined,
    title:typeof raw.title==='string'?raw.title:undefined,
    linkUrl:typeof raw.link_url==='string'?raw.link_url:undefined,
    callToAction:typeof raw.call_to_action_type==='string'?raw.call_to_action_type:undefined,
    mediaUrl:typeof raw.image_url==='string'?raw.image_url:typeof raw.video_id==='string'?raw.video_id:undefined,
    raw
  };
};

export function buildAdIntelligence(accounts:MetaAdAccount[],campaigns:MetaCampaign[],adSets:MetaAdSet[],ads:MetaAd[],insights:MetaInsight[],collectedAt=new Date().toISOString()):AdIntelligence[]{
  const campaignsById=new Map(campaigns.map(item=>[item.id,item]));
  const adSetsById=new Map(adSets.map(item=>[item.id,item]));
  const adsById=new Map(ads.map(item=>[item.id,item]));
  const accountById=new Map(accounts.map(item=>[item.id,item]));
  return insights.map((insight,index)=>{
    const ad=insight.adId?adsById.get(insight.adId):undefined;
    const adSet=insight.adSetId?adSetsById.get(insight.adSetId):ad?.adSetId?adSetsById.get(ad.adSetId):undefined;
    const campaign=insight.campaignId?campaignsById.get(insight.campaignId):adSet?.campaignId?campaignsById.get(adSet.campaignId):undefined;
    const account=insight.accountId?accountById.get(insight.accountId):undefined;
    return{
      accountId:insight.accountId||account?.id,
      campaign:campaign?{id:campaign.id,name:campaign.name,status:campaign.effectiveStatus||campaign.status}:undefined,
      adSet:adSet?{id:adSet.id,name:adSet.name,status:adSet.status}:undefined,
      ad:ad?{id:ad.id,name:ad.name,status:ad.status}:undefined,
      creative:creativeFrom(ad),platform:'meta' as const,
      deliveryStatus:ad?.status||adSet?.status||campaign?.effectiveStatus||campaign?.status,
      dateRange:{start:insight.dateStart,end:insight.dateStop},metrics:insight.metrics,source:'Meta Marketing API' as const,
      collectedAt,evidenceIds:[`meta-insight-${insight.adId||insight.campaignId||insight.accountId||index+1}`]
    };
  });
}
