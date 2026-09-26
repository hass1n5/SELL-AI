import type {NormalizedSerpApiResult,SerpApiEngine,SerpApiResearchResult} from './types';
interface CacheEntry{key:string;storedAt:string;result:NormalizedSerpApiResult;}
const cache=new Map<string,CacheEntry>();
const keyFor=(query:string,region:string,engine:SerpApiEngine)=>`${engine}|${region.trim().toLowerCase()}|${query.trim().toLowerCase()}`;
export function getCachedSerpApiResult(query:string,region:string,engine:SerpApiEngine,maxAgeHours=1):SerpApiResearchResult|null{const key=keyFor(query,region,engine);const entry=cache.get(key);if(!entry)return null;const ageHours=(Date.now()-Date.parse(entry.storedAt))/3600000;if(!Number.isFinite(ageHours)||ageHours>maxAgeHours)return null;return{...entry.result,cacheHit:true,cacheAgeHours:Math.max(0,Math.round(ageHours*10)/10),latencyMs:0,requestId:`cache-${Date.parse(entry.storedAt)}`};}
export function setCachedSerpApiResult(result:NormalizedSerpApiResult){const key=keyFor(result.query,result.region,result.engine);cache.set(key,{key,storedAt:result.collectedAt,result});return result;}
export function clearSerpApiCache(){cache.clear();}
