import type {MetaClient} from './client';
import {MetaProviderError} from './types';
import type {MetaCatalog,MetaProductSet,MetaProductItem} from './types';

const text=(value:unknown)=>typeof value==='string'?value:undefined;
const numberValue=(value:unknown)=>typeof value==='number'?value:Number.isFinite(Number(value))?Number(value):null;

export async function listBusinesses(client:MetaClient):Promise<Array<{id:string;name?:string;raw:Record<string,unknown>}>>{
  const response=await client.get<{data?:Record<string,unknown>[]}>(`/me/businesses`,{fields:'id,name',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),name:text(item.name),raw:item}));
}

export async function listCatalogs(client:MetaClient,businessId?:string):Promise<MetaCatalog[]>{
  let id=businessId?.trim()||client.config.businessId;
  if(!id){
    const businesses=await listBusinesses(client);
    id=businesses[0]?.id;
  }
  if(!id)throw new MetaProviderError('unavailable','No Meta Business asset is available for catalog discovery.');
  const response=await client.get<{data?:Record<string,unknown>[]}>(`/${encodeURIComponent(id)}/owned_product_catalogs`,{fields:'id,name,product_count',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),name:text(item.name),productCount:numberValue(item.product_count),raw:item}));
}

export async function listProductSets(client:MetaClient,catalogId:string):Promise<MetaProductSet[]>{
  if(!catalogId)throw new MetaProviderError('invalid_configuration','A Meta catalog id is required.');
  const response=await client.get<{data?:Record<string,unknown>[]}>(`/${encodeURIComponent(catalogId)}/product_sets`,{fields:'id,name,product_count',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),name:text(item.name),productCount:numberValue(item.product_count),raw:item}));
}

export async function listProductItems(client:MetaClient,productSetId:string):Promise<MetaProductItem[]>{
  if(!productSetId)throw new MetaProviderError('invalid_configuration','A Meta product set id is required.');
  const response=await client.get<{data?:Record<string,unknown>[]}>(`/${encodeURIComponent(productSetId)}/products`,{fields:'id,name,availability,price,url,description,image_url,brand,retailer_id',limit:100});
  return(response.data||[]).filter(item=>typeof item.id==='string').map(item=>({id:String(item.id),name:text(item.name),availability:text(item.availability),price:text(item.price),url:text(item.url),raw:item}));
}
