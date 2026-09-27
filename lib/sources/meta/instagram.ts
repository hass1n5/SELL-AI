import type {MetaClient} from './client';
import {MetaProviderError} from './types';
import type {MetaInstagramAccount,MetaInstagramMedia} from './types';
import {discoverMetaPages} from './auth';

const stringValue=(value:unknown)=>typeof value==='string'?value:undefined;
const numberValue=(value:unknown)=>typeof value==='number'?value:Number.isFinite(Number(value))?Number(value):null;

export async function discoverInstagramAccount(client:MetaClient,pageId?:string,configuredId?:string):Promise<MetaInstagramAccount>{
  let id=configuredId?.trim();
  if(!id){
    const page=pageId?.trim()||(await discoverMetaPages(client))[0]?.id;
    if(!page)throw new MetaProviderError('unavailable','No Facebook Page is available for Instagram discovery.');
    const response=await client.get<{instagram_business_account?:{id?:string}}>(`/${encodeURIComponent(page)}`,{fields:'instagram_business_account'});
    id=response.instagram_business_account?.id;
  }
  if(!id)throw new MetaProviderError('unavailable','No connected Instagram Professional account was found.');
  const raw=await client.get<Record<string,unknown>>(`/${encodeURIComponent(id)}`,{fields:'id,username,name,profile_picture_url,followers_count,media_count'});
  if(typeof raw.id!=='string')throw new MetaProviderError('malformed_response','Instagram account response did not include an id.');
  return{id:raw.id,username:stringValue(raw.username),name:stringValue(raw.name),profilePictureUrl:stringValue(raw.profile_picture_url),followersCount:numberValue(raw.followers_count),mediaCount:numberValue(raw.media_count),raw};
}

export async function listInstagramMedia(client:MetaClient,accountId:string):Promise<MetaInstagramMedia[]>{
  const response=await client.get<{data?:Record<string,unknown>[]}>(`/${encodeURIComponent(accountId)}/media`,{fields:'id,caption,media_type,permalink,timestamp,like_count,comments_count',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),caption:stringValue(item.caption),mediaType:stringValue(item.media_type),permalink:stringValue(item.permalink),timestamp:stringValue(item.timestamp),likeCount:numberValue(item.like_count),commentsCount:numberValue(item.comments_count),raw:item}));
}
