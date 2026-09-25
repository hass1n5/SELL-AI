import {createEvidence} from '../evidence';
import {EvidenceItem} from '../types';
import {normalizeBatch} from '../normalization';
import {RawSourceData,SourceRegistry} from '../sources/registry';
import {verifyEvidence} from '../evidence/verification';

export async function ingestRawData(raw:RawSourceData[]):Promise<EvidenceItem[]>{
 const normalized=normalizeBatch(raw);
 return normalized.map((item,index)=>createEvidence({...item,id:item.id||`${item.sourceId}-${index+1}`,confidence:0.5,status:'unverified'}));
}
export async function ingestFromSource(registry:SourceRegistry,sourceId:string,query:string,region:string){
 const raw=await registry.collect(sourceId,query,region); const evidence=await ingestRawData(raw); return verifyEvidence(evidence);
}
