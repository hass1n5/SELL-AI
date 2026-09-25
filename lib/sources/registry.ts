import {EvidenceItem,SourceType} from '../types';

export interface RawSourceData{id?:string;sourceId:string;source:string;sourceType:SourceType;sourceUrl:string;region:string;claim:string;originalValue:string;metadata?:EvidenceItem['metadata'];collectedAt?:string;}
export interface SourceAdapter{readonly id:string;readonly name:string;readonly type:SourceType;readonly available:boolean;collect(query:string,region:string):Promise<RawSourceData[]>;}
export class SourceRegistry{
 private adapters=new Map<string,SourceAdapter>();
 register(adapter:SourceAdapter){this.adapters.set(adapter.id,adapter);return this;}
 get(id:string){return this.adapters.get(id);}
 list(){return [...this.adapters.values()];}
 async collect(id:string,query:string,region:string){const adapter=this.get(id);if(!adapter)throw new Error(`Source adapter unavailable: ${id}`);if(!adapter.available)throw new Error(`Source adapter not connected: ${id}`);return adapter.collect(query,region);}
}

export const sourceRegistry=new SourceRegistry();
export const sourceCategories:SourceType[]=['search','social','marketplace','ads','reviews','pricing'];

export function registerSource(adapter:SourceAdapter){sourceRegistry.register(adapter);}
