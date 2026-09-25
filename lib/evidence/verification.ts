import {EvidenceItem,VerificationReport} from '../types';
import {calculateFreshness} from './freshness';

const normalized=(value:string)=>value.trim().toLowerCase().replace(/\s+/g,' ');
export function findDuplicateEvidence(records:EvidenceItem[]):string[]{
 const seen=new Map<string,string>(); const duplicates:string[]=[];
 records.forEach(record=>{const key=`${record.claim}|${record.sourceId}|${normalized(record.normalizedValue)}`;if(seen.has(key))duplicates.push(record.id);else seen.set(key,record.id);});
 return duplicates;
}
export function findConflictingEvidence(records:EvidenceItem[]):string[]{
 const groups=new Map<string,EvidenceItem[]>();
 records.forEach(record=>{const key=`${record.claim}|${record.region}`;groups.set(key,[...(groups.get(key)||[]),record]);});
 const conflicts:string[]=[];
 groups.forEach(items=>{const values=new Set(items.map(item=>normalized(item.normalizedValue)));if(values.size>1&&items.length>1)items.forEach(item=>conflicts.push(item.id));});
 return [...new Set(conflicts)];
}
export function findAnomalies(records:EvidenceItem[]):string[]{
 return records.filter(record=>record.confidence<0||record.confidence>1||!record.claim||!record.source||!record.sourceUrl).map(record=>record.id);
}
export function verifyEvidence(records:EvidenceItem[],requiredClaims:string[]=[]):VerificationReport{
 const now=new Date();
 const stale:string[]=[];
 records.forEach(record=>{const freshness=calculateFreshness(record.collectedAt,now);if(freshness.state==='stale'||freshness.state==='expired')stale.push(record.id);});
 const duplicates=findDuplicateEvidence(records); const conflicts=findConflictingEvidence(records); const anomalies=findAnomalies(records);
 const present=new Set(records.map(record=>record.claim));
 const missingClaims=requiredClaims.filter(claim=>!present.has(claim));
 const verified=records.map(record=>{const freshness=calculateFreshness(record.collectedAt,now);let status=record.verificationStatus;
  if(conflicts.includes(record.id))status='conflict'; else if(duplicates.includes(record.id))status='partial'; else if(stale.includes(record.id))status='stale'; else if(anomalies.includes(record.id))status='unverified';
  return{...record,freshnessHours:freshness.freshnessHours,freshness:freshness.state,status,verificationStatus:status};
 });
 return{verified,duplicates,stale,conflicts,missingClaims,anomalies};
}
