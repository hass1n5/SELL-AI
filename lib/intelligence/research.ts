import {ResearchProviderCost,ResearchRequest,SourceType} from '../types';
import {getApifyConfig} from '../sources/apify';
import {getSerpApiConfig} from '../sources/serpapi';
export function getResearchProviders():ResearchProviderCost[]{
 const apify=getApifyConfig();
 const serpapi=getSerpApiConfig();
 return[
  {sourceName:'Public web search',sourceType:'search',estimatedCost:0,priority:'FREE/PUBLIC',availability:'not-connected',enabled:false},
  {sourceName:'Marketplace API',sourceType:'marketplace',estimatedCost:0,priority:'LOW-COST',availability:'credential-required',enabled:false},
  {sourceName:'Social listening provider',sourceType:'social',estimatedCost:0,priority:'PAID',availability:'credential-required',enabled:false},
  {sourceName:'Apify actors',sourceType:'marketplace',estimatedCost:0,priority:'APIFY / EXPENSIVE',availability:apify.token&&apify.actorId?'available':'credential-required',enabled:Boolean(apify.token&&apify.actorId)},
  {sourceName:'SerpApi search',sourceType:'search',estimatedCost:null,priority:'PAID',availability:serpapi.apiKey?'available':'credential-required',enabled:Boolean(serpapi.apiKey)},
 ];
}
export const researchProviders:ResearchProviderCost[]=getResearchProviders();
export function createResearchRequest(query:string,missingEvidence:string[],requiredSource?:SourceType,priority:ResearchRequest['priority']='FREE/PUBLIC'):ResearchRequest{
 return{id:`research-${Date.now()}`,productQuery:query,missingEvidence,requiredSource,region:'User-defined',priority,estimatedCost:0,status:'missing',createdAt:new Date().toISOString()};
}
