import type {MetaClient} from './client';
import type {MetaPage,MetaUser} from './types';

export async function getMetaUser(client:MetaClient):Promise<MetaUser>{return client.getMe();}

export async function discoverMetaPages(client:MetaClient):Promise<MetaPage[]>{
  const response=await client.getPages();
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({
    id:String(item.id),
    name:typeof item.name==='string'?item.name:undefined,
    category:typeof item.category==='string'?item.category:undefined,
    link:typeof item.link==='string'?item.link:undefined,
    fanCount:typeof item.fan_count==='number'?item.fan_count:null,
    followersCount:typeof item.followers_count==='number'?item.followers_count:null,
    raw:item
  }));
}
