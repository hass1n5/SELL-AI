import {ResearchProviderCost,ResearchRequest,SourceType} from '../types';
export const researchProviders:ResearchProviderCost[]=[
 {sourceName:'Public web search',sourceType:'search',estimatedCost:0,priority:'FREE/PUBLIC',availability:'not-connected',enabled:false},
 {sourceName:'Marketplace API',sourceType:'marketplace',estimatedCost:0,priority:'LOW-COST',availability:'credential-required',enabled:false},
 {sourceName:'Social listening provider',sourceType:'social',estimatedCost:0,priority:'PAID',availability:'credential-required',enabled:false},
 {sourceName:'Apify actors',sourceType:'marketplace',estimatedCost:0,priority:'APIFY / EXPENSIVE',availability:'not-connected',enabled:false},
];
export function createResearchRequest(query:string,missingEvidence:string[],requiredSource?:SourceType):ResearchRequest{
 return{id:`research-${Date.now()}`,productQuery:query,missingEvidence,requiredSource,region:'User-defined',priority:'FREE/PUBLIC',estimatedCost:0,status:'missing',createdAt:new Date().toISOString()};
}
