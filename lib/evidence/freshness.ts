import {FreshnessState} from '../types';

export interface FreshnessThresholds{agingHours:number;staleHours:number;expiredHours:number;}
export const DEFAULT_FRESHNESS_THRESHOLDS:FreshnessThresholds={agingHours:24,staleHours:72,expiredHours:168};

export function calculateFreshness(collectedAt:string,now=new Date(),thresholds=DEFAULT_FRESHNESS_THRESHOLDS){
 const collected=Date.parse(collectedAt);
 const freshnessHours=Number.isFinite(collected)?Math.max(0,(now.getTime()-collected)/3600000):thresholds.expiredHours;
 let state:FreshnessState='fresh';
 if(!Number.isFinite(collected)||freshnessHours>=thresholds.expiredHours)state='expired';
 else if(freshnessHours>=thresholds.staleHours)state='stale';
 else if(freshnessHours>=thresholds.agingHours)state='aging';
 return{freshnessHours:Math.round(freshnessHours*10)/10,state};
}
