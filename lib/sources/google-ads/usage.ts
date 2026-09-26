import type {GoogleAdsUsageRecord} from './types';
const records:GoogleAdsUsageRecord[]=[];
export function recordGoogleAdsUsage(record:GoogleAdsUsageRecord){records.push(record);if(records.length>100)records.shift();}
export function getGoogleAdsUsageSummary(){const last=[...records].reverse().find(item=>item.success);const error=[...records].reverse().find(item=>!item.success);return{requestCount:records.length,lastSuccessfulResearch:last?.timestamp||null,lastError:error?.errorCode||null};}
export function getGoogleAdsUsage(){return records.slice();}
export function clearGoogleAdsUsage(){records.length=0;}
