import type {SeoResearchResult} from './seo';
let latest:SeoResearchResult|null=null;
export function saveSeoResearch(result:SeoResearchResult){latest=result;return result;}
export function getLatestSeoResearch(){return latest;}
export function clearSeoResearch(){latest=null;}
