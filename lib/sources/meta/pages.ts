import type {MetaClient} from './client';
import {discoverMetaPages} from './auth';
import type {MetaPage} from './types';

export async function listPages(client:MetaClient):Promise<MetaPage[]>{return discoverMetaPages(client);}

export async function getPage(client:MetaClient,pageId:string):Promise<MetaPage>{
  const id=encodeURIComponent(pageId);
  const item=await client.get<Record<string,unknown>>(`/${id}`,{fields:'id,name,category,link,fan_count,followers_count'});
  if(typeof item.id!=='string')throw new Error('Meta page response did not include an id.');
  return{
    id:item.id,
    name:typeof item.name==='string'?item.name:undefined,
    category:typeof item.category==='string'?item.category:undefined,
    link:typeof item.link==='string'?item.link:undefined,
    fanCount:typeof item.fan_count==='number'?item.fan_count:null,
    followersCount:typeof item.followers_count==='number'?item.followers_count:null,
    raw:item
  };
}
