import type {SerpApiUsageRecord} from './types';
const records:SerpApiUsageRecord[]=[];const cacheLimit=100;
export function recordSerpApiUsage(record:SerpApiUsageRecord){records.unshift(record);if(records.length>cacheLimit)records.length=cacheLimit;return record;}
export function getSerpApiUsage(){return[...records];}
export function getSerpApiUsageSummary(){const success=records.find(item=>item.success);const last=records[0];return{requestCount:records.length,lastSuccessfulResearch:success?.timestamp||null,lastError:last&&!last.success?last.errorCode||'unknown':null};}
