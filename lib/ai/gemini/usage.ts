import type {GeminiUsageRecord} from './types';

const usage:GeminiUsageRecord[]=[];
const maxEntries=100;
export function recordGeminiUsage(record:GeminiUsageRecord){usage.unshift(record);if(usage.length>maxEntries)usage.length=maxEntries;return record;}
export function getGeminiUsage(){return[...usage];}
export function getGeminiUsageSummary(){const latest=usage.find(item=>item.operation==='report'&&item.success);return{usageCount:usage.length,lastAnalysisTime:latest?.timestamp||null,evidenceAnalyzed:latest?.evidenceAnalyzed||0,evidenceExcluded:latest?.evidenceExcluded||0};}
export function estimateTokens(value:unknown){try{return Math.max(1,Math.ceil(JSON.stringify(value).length/4));}catch{return null;}}
export function estimateCost(inputTokens:number|null,outputTokens:number|null,env:NodeJS.ProcessEnv=process.env){
 const inputRate=Number(env.GEMINI_INPUT_COST_PER_MILLION); const outputRate=Number(env.GEMINI_OUTPUT_COST_PER_MILLION);
 if(!Number.isFinite(inputRate)||!Number.isFinite(outputRate)||inputTokens===null||outputTokens===null)return null;
 return(inputTokens/1_000_000)*inputRate+(outputTokens/1_000_000)*outputRate;
}
