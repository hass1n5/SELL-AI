import {ResearchProviderCost,ResearchRequest,SourceType} from '../types';
import {getApifyConfig} from '../sources/apify';
export function getResearchProviders():ResearchProviderCost[]{
 const apify=getApifyConfig();
 return[
  {sourceName:'Public web search',sourceType:'search',estimatedCost:0,priority:'FREE/PUBLIC',availability:'not-connected',enabled:false},
  {sourceName:'Marketplace API',sourceType:'marketplace',estimatedCost:0,priority:'LOW-COST',availability:'credential-required',enabled:false},
  {sourceName:'Social listening provider',sourceType:'social',estimatedCost:0,priority:'PAID',availability:'credential-required',enabled:false},
  {sourceName:'Apify actors',sourceType:'marketplace',estimatedCost:0,priority:'APIFY / EXPENSIVE',availability:apify.token&&apify.actorId?'available':'credential-required',enabled:Boolean(apify.token&&apify.actorId)},
 ];
}
export const researchProviders:ResearchProviderCost[]=getResearchProviders();
export function createResearchRequest(query:string,missingEvidence:string[],requiredSource?:SourceType,priority:ResearchRequest['priority']='FREE/PUBLIC'):ResearchRequest{
 return{id:`research-${Date.now()}`,productQuery:query,missingEvidence,requiredSource,region:'User-defined',priority,estimatedCost:0,status:'missing',createdAt:new Date().toISOString()};
}
