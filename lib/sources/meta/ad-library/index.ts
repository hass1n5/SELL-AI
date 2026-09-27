import type {MetaClient} from '../client';
import {MetaProviderError} from '../types';

export interface MetaAdLibraryItem{
  id:string;
  pageId?:string;
  pageName?:string;
  adCreationTime?:string;
  adDeliveryStopTime?:string;
  adCreativeBody?:string;
  adCreativeLinkTitle?:string;
  adCreativeLinkCaption?:string;
  adSnapshotUrl?:string;
  raw:Record<string,unknown>;
}

export interface MetaAdLibraryRequest{query:string;region:string;dateStart?:string;dateEnd?:string;pageId?:string;limit?:number;}

export async function researchAdLibrary(client:MetaClient,request:MetaAdLibraryRequest):Promise<MetaAdLibraryItem[]>{
  if(!request.query?.trim())throw new MetaProviderError('invalid_configuration','An Ad Library search query is required.');
  if(!request.region?.trim())throw new MetaProviderError('invalid_configuration','An Ad Library region is required.');
  const response=await client.get<{data?:Record<string,unknown>[]}>(`/ads_archive`,{
    search_terms:request.query.trim(),ad_reached_countries:JSON.stringify([request.region.trim().toUpperCase()]),ad_active_status:'ALL',fields:'id,page_id,page_name,ad_creation_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_captions,ad_snapshot_url',limit:Math.min(100,Math.max(1,request.limit||25)),ad_delivery_date_min:request.dateStart,ad_delivery_date_max:request.dateEnd,page_id:request.pageId
  });
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({
    id:String(item.id),pageId:typeof item.page_id==='string'?item.page_id:undefined,pageName:typeof item.page_name==='string'?item.page_name:undefined,
    adCreationTime:typeof item.ad_creation_time==='string'?item.ad_creation_time:undefined,adDeliveryStopTime:typeof item.ad_delivery_stop_time==='string'?item.ad_delivery_stop_time:undefined,
    adCreativeBody:Array.isArray(item.ad_creative_bodies)?String(item.ad_creative_bodies[0]||''):typeof item.ad_creative_bodies==='string'?item.ad_creative_bodies:undefined,
    adCreativeLinkTitle:Array.isArray(item.ad_creative_link_titles)?String(item.ad_creative_link_titles[0]||''):typeof item.ad_creative_link_titles==='string'?item.ad_creative_link_titles:undefined,
    adCreativeLinkCaption:Array.isArray(item.ad_creative_link_captions)?String(item.ad_creative_link_captions[0]||''):typeof item.ad_creative_link_captions==='string'?item.ad_creative_link_captions:undefined,
    adSnapshotUrl:typeof item.ad_snapshot_url==='string'?item.ad_snapshot_url:undefined,raw:item
  }));
}
