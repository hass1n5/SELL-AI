import type {AnalysisResult,EvidenceItem,ProductDNA,ProductInput,VerificationReport} from '../../../lib/types';

export type AnalystClaimStatus='VERIFIED'|'INFERRED'|'UNKNOWN'|'CONFLICTING'|'INSUFFICIENT EVIDENCE';
export interface EvidenceClaim{claim:string;status:AnalystClaimStatus;evidenceIds:string[];}
export interface AnalystSection{summary:EvidenceClaim;claims:EvidenceClaim[];}
export interface ResearchGap{missingField:string;reason:string;suggestedSourceType:string;priority:'high'|'medium'|'low';evidenceIds:string[];}
export interface TestPlan{step:string;successMetric:string;guardrail:string;evidenceIds:string[];}

export interface AnalystInput{
 product:ProductInput;
 evidence:EvidenceItem[];
 verification:VerificationReport;
 productDNA:ProductDNA;
 trend:AnalysisResult['trend'];
 buyerIntent:AnalysisResult['buyerIntent'];
 competition:ProductDNA['competition'];
 pricing:ProductDNA['price'];
 profit:AnalysisResult['profit'];
 risk:AnalysisResult['risk'];
 researchGaps:ResearchGap[];
 region:string;
}

export interface ShouldISellAnalysis{
 supportingEvidence:EvidenceClaim[];
 concerns:EvidenceClaim[];
 missingEvidence:EvidenceClaim[];
 assumptions:EvidenceClaim[];
 controlledTestRecommendation:EvidenceClaim;
}
export interface GeminiReport{
 executiveSummary:EvidenceClaim;
 demandInterpretation:AnalystSection;
 trendInterpretation:AnalystSection;
 buyerIntentInterpretation:AnalystSection;
 competitionInterpretation:AnalystSection;
 pricingInterpretation:AnalystSection;
 profitInterpretation:AnalystSection;
 riskInterpretation:AnalystSection;
 evidenceGaps:ResearchGap[];
 researchRecommendations:EvidenceClaim[];
 testPlan:TestPlan[];
 shouldISell:ShouldISellAnalysis;
 metadata:{model:string;generatedAt:string;evidenceAnalyzed:number;evidenceExcluded:number;lastAnalysisTime:string;};
}

export interface GeminiChatResponse{answer:EvidenceClaim;supportingEvidence:EvidenceClaim[];researchGaps:ResearchGap[];}
export interface GeminiUsageRecord{requestId:string;timestamp:string;model:string;estimatedInputTokens:number|null;estimatedOutputTokens:number|null;success:boolean;estimatedCost:number|null;operation:'report'|'chat'|'status';evidenceAnalyzed?:number;evidenceExcluded?:number;errorCode?:string;}
export interface GeminiStatus{status:'CONNECTED'|'NOT CONNECTED';model:string;lastAnalysisTime:string|null;evidenceAnalyzed:number;evidenceExcluded:number;usageCount:number;message:string;}
export interface GeminiConfig{apiKey?:string;model:string;baseUrl:string;timeoutMs:number;maxRetries:number;}
export interface GeminiApiResponse{candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>;usageMetadata?:{promptTokenCount?:number; candidatesTokenCount?:number; totalTokenCount?:number};}
