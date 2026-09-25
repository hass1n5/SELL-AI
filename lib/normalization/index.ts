import {RawSourceData} from '../sources/registry';

export interface NormalizedSourceData extends RawSourceData{normalizedValue:string;}
export function normalizeSourceData(raw:RawSourceData):NormalizedSourceData{
 const original=String(raw.originalValue??'');
 return{...raw,normalizedValue:original.trim().replace(/\s+/g,' ')};
}
export function normalizeBatch(raw:RawSourceData[]){return raw.map(normalizeSourceData);}
