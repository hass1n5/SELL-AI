import {EvidenceItem,EvidenceStatus,SourceType} from '../types';
import {calculateFreshness,DEFAULT_FRESHNESS_THRESHOLDS,FreshnessThresholds} from './freshness';

export interface EvidenceInput{
 id:string; claim:string; source:string; sourceType:SourceType; sourceUrl:string; sourceId:string; region:string;
 originalValue:string; normalizedValue:string; collectedAt?:string; status?:EvidenceStatus; confidence?:number;
 metadata?:EvidenceItem['metadata'];
}

export function createEvidence(input:EvidenceInput,now=new Date(),thresholds:FreshnessThresholds=DEFAULT_FRESHNESS_THRESHOLDS):EvidenceItem{
 const collectedAt=input.collectedAt||now.toISOString();
 const freshness=calculateFreshness(collectedAt,now,thresholds);
 const status=input.status||'unverified';
 return{...input,timestamp:collectedAt,collectedAt,freshnessHours:freshness.freshnessHours,freshness:freshness.state,status,verificationStatus:status,confidence:Math.max(0,Math.min(1,input.confidence??0)),metadata:input.metadata};
}

export function evidenceSummary(evidence:EvidenceItem[]){
 return{evidenceCount:evidence.length,verifiedEvidenceCount:evidence.filter(item=>item.verificationStatus==='verified').length,staleEvidenceCount:evidence.filter(item=>item.freshness==='stale'||item.freshness==='expired'||item.verificationStatus==='stale').length,conflictingEvidenceCount:evidence.filter(item=>item.verificationStatus==='conflict').length};
}
