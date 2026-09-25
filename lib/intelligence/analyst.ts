import {EvidenceItem} from '../types';
export interface AnalystInput{evidence:EvidenceItem[];productName:string;}
export interface AnalystOutput{status:'not-connected';message:string;}
export function prepareAnalystInput(productName:string,evidence:EvidenceItem[]):AnalystInput{return{productName,evidence};}
export function runAnalyst(_input:AnalystInput):AnalystOutput{return{status:'not-connected',message:'Gemini analyst is not connected. Evidence remains the source of truth.'};}
