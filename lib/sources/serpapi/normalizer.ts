import {createEvidence,verifyEvidence} from '../../evidence';
import type {EvidenceItem} from '../../types';
import type {NormalizedSerpApiResult,SearchSignals,SerpApiRawResponse,SerpApiRawResult,SerpApiSearchRequest} from './types';

const clean=(value:unknown)=>typeof value==='string'?value.trim():'';
const countValues=(values:string[])=>{const counts=new Map<string,number>();values.filter(Boolean).forEach(value=>counts.set(value,(counts.get(value)||0)+1));return[...counts.entries()].filter(([,count])=>count>1).map(([value,count])=>({value,count}));};
const priceFrom=(item:SerpApiRawResult)=>{if(typeof item.extracted_price==='number'&&Number.isFinite(item.extracted_price))return item.extracted_price;const match=clean(item.price).replace(/,/g,'').match(/\d+(?:\.\d+)?/);return match?Number(match[0]):null;};
export function buildSearchSignals(response:SerpApiRawResponse):SearchSignals{
 const organic=response.organic_results||[];const shopping=response.shopping_results||[];const all=[...organic,...shopping];const prices=all.map(priceFrom).filter((value):value is number=>value!==null);const resultCount=typeof response.search_information?.total_results==='number'?response.search_information.total_results:null;
 const indicators=['Search presence is an indicator only, not sales proof.'];if(resultCount!==null)indicators.push('SerpApi supplied a total result count.');if(shopping.length)indicators.push('Shopping results were present.');
 return{resultCount,organicResultCount:organic.length,shoppingResultCount:shopping.length,rankingPositions:all.map(item=>item.position).filter((value):value is number=>typeof value==='number'),recurringProducts:countValues(all.map(item=>clean(item.title))),recurringBrands:countValues(all.map(item=>clean(item.source))),recurringCategories:countValues(all.map(item=>clean(item.category))),shoppingPresence:shopping.length>0,priceRange:prices.length?{min:Math.min(...prices),max:Math.max(...prices),currency:'unknown'}:null,indicators};
}

function resultEvidence(item:SerpApiRawResult,index:number,request:SerpApiSearchRequest,collectedAt:string,type:'organic'|'shopping'):EvidenceItem{
 const title=clean(item.title);const link=clean(item.link);const sourceId=clean(item.product_id)||link||`${request.query}-${type}-${index+1}`;const sourceUrl=link||`https://serpapi.com/search?engine=${request.engine||'google'}&q=${encodeURIComponent(request.query)}`;const normalized={title:title||null,source:clean(item.source)||null,price:clean(item.price)||null,extractedPrice:typeof item.extracted_price==='number'?item.extracted_price:null};
 return createEvidence({id:`serpapi-${sourceId.replace(/[^a-z0-9]+/gi,'-').slice(0,80)}-${index+1}`,claim:`${type==='shopping'?'Shopping':'Search'} result${title?`: ${title}`:''}`,source:'SerpApi',sourceType:type==='shopping'?'marketplace':'search',sourceUrl,sourceId,region:request.region||request.location||'Unspecified',originalValue:JSON.stringify(item),normalizedValue:JSON.stringify(normalized),collectedAt,status:'unverified',confidence:0,metadata:{provider:'serpapi',query:request.query,category:type,tags:['EXTERNAL SOURCE','SEARCH INDICATOR'],notes:'Search presence is not sales proof.'}});
}

export function normalizeSerpApiResponse(response:SerpApiRawResponse,request:SerpApiSearchRequest):NormalizedSerpApiResult{
 const collectedAt=new Date().toISOString();const organic=response.organic_results||[];const shopping=response.shopping_results||[];const evidence=[...organic.map((item,index)=>resultEvidence(item,index,request,collectedAt,'organic')),...shopping.map((item,index)=>resultEvidence(item,index,request,collectedAt,'shopping'))];const verification=verifyEvidence(evidence);return{evidence:verification.verified,verification,signals:buildSearchSignals(response),rawCount:evidence.length,engine:request.engine||'google',query:request.query,region:request.region||request.location||'Unspecified',collectedAt,sourceStatus:evidence.length?'success':'empty'};
}
