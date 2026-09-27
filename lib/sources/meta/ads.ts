import type {MetaClient} from './client';
import {MetaProviderError} from './types';
import type {MetaAdAccount,MetaCampaign,MetaAdSet,MetaAd,MetaInsight} from './types';

const asString=(value:unknown)=>typeof value==='string'?value:undefined;
const asNumber=(value:unknown)=>typeof value==='number'?value:Number.isFinite(Number(value))?Number(value):null;
const accountPath=(accountId:string)=>`/act_${accountId.replace(/^act_/i,'')}`;

export async function listAdAccounts(client:MetaClient):Promise<MetaAdAccount[]>{
  const response=await client.get<{data?:Record<string,unknown>[]}>('/me/adaccounts',{fields:'id,name,account_status,currency,timezone_name,amount_spent',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id).replace(/^act_/i,''),name:asString(item.name),accountStatus:asNumber(item.account_status),currency:asString(item.currency),timezoneName:asString(item.timezone_name),amountSpent:asNumber(item.amount_spent),raw:item}));
}

export async function listCampaigns(client:MetaClient,accountId:string):Promise<MetaCampaign[]>{
  const response=await client.get<{data?:Record<string,unknown>[]}>(`${accountPath(accountId)}/campaigns`,{fields:'id,name,status,effective_status',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),name:asString(item.name),status:asString(item.status),effectiveStatus:asString(item.effective_status),raw:item}));
}

export async function listAdSets(client:MetaClient,accountId:string):Promise<MetaAdSet[]>{
  const response=await client.get<{data?:Record<string,unknown>[]}>(`${accountPath(accountId)}/adsets`,{fields:'id,name,status,campaign_id,effective_status',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),name:asString(item.name),status:asString(item.status)||asString(item.effective_status),campaignId:asString(item.campaign_id),raw:item}));
}

export async function listAds(client:MetaClient,accountId:string):Promise<MetaAd[]>{
  const response=await client.get<{data?:Record<string,unknown>[]}>(`${accountPath(accountId)}/ads`,{fields:'id,name,status,effective_status,adset_id,creative{id,object_type,body,title,link_url,call_to_action_type,image_url,video_id}',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),name:asString(item.name),status:asString(item.status)||asString(item.effective_status),adSetId:asString(item.adset_id),creative:item.creative&&typeof item.creative==='object'?item.creative as Record<string,unknown>:undefined,raw:item}));
}

export async function getAdInsights(client:MetaClient,accountId:string,options:{dateStart?:string;dateEnd?:string;level?:'account'|'campaign'|'adset'|'ad'}={}):Promise<MetaInsight[]>{
  const timeRange=options.dateStart||options.dateEnd?JSON.stringify({since:options.dateStart||options.dateEnd,until:options.dateEnd||options.dateStart}):undefined;
  const response=await client.get<{data?:Record<string,unknown>[]}>(`${accountPath(accountId)}/insights`,{fields:'account_id,campaign_id,adset_id,ad_id,date_start,date_stop,spend,impressions,clicks,ctr,cpc,conversions,actions,reach,frequency,roas',level:options.level||'ad',time_range:timeRange,limit:500});
  return(response.data||[]).map(item=>{const metrics:Record<string,number|string|null>={};['spend','impressions','clicks','ctr','cpc','conversions','reach','frequency','roas'].forEach(key=>{if(key in item)metrics[key]=asNumber(item[key]);});if(Array.isArray(item.actions))metrics.actions=JSON.stringify(item.actions);return{accountId:asString(item.account_id)||accountId,campaignId:asString(item.campaign_id),adSetId:asString(item.adset_id),adId:asString(item.ad_id),dateStart:asString(item.date_start),dateStop:asString(item.date_stop),metrics,raw:item};});
}

export async function researchAds(client:MetaClient,accountId:string,options:{dateStart?:string;dateEnd?:string;level?:'account'|'campaign'|'adset'|'ad'}={}):Promise<{accounts:MetaAdAccount[];campaigns:MetaCampaign[];adSets:MetaAdSet[];ads:MetaAd[];insights:MetaInsight[]}>{
  if(!accountId)throw new MetaProviderError('invalid_configuration','A Meta ad account id is required.');
  const [accounts,campaigns,adSets,ads,insights]=await Promise.all([listAdAccounts(client),listCampaigns(client,accountId),listAdSets(client,accountId),listAds(client,accountId),getAdInsights(client,accountId,options)]);
  return{accounts,campaigns,adSets,ads,insights};
}
