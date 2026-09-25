export type TrendState='emerging'|'rising'|'stable'|'saturating'|'declining';
export type EvidenceStatus='verified'|'partial'|'stale'|'conflict'|'missing'|'unverified';
export type FreshnessState='fresh'|'aging'|'stale'|'expired';
export type SourceType='manual'|'search'|'social'|'marketplace'|'ads'|'reviews'|'pricing'|'demo';

export interface EvidenceMetadata{provider?:string;query?:string;category?:string;tags?:string[];rawHash?:string;notes?:string;}
export interface EvidenceItem{
 id:string; claim:string; source:string; sourceType:SourceType; sourceUrl:string; sourceId:string;
 timestamp:string; collectedAt:string; region:string; originalValue:string; normalizedValue:string;
 freshnessHours:number; freshness:FreshnessState; status:EvidenceStatus; verificationStatus:EvidenceStatus;
 confidence:number; metadata?:EvidenceMetadata;
}

export interface ProductInput{
 name:string; sellingPrice:number; productCost:number; shipping:number; packaging:number; platformFee:number; paymentFee:number; adCost:number; returnCost:number;
 demandNow:number; demandPrevious:number; competitionNow:number; adsNow:number; reviewCount:number; reviewRating:number; trustSignals:number; problemClarity:number; visualAppeal:number;
}

export interface ProductDNA{
 identity:{name:string;category:string;mode:'DEMO / SIMULATED'|'USER INPUT'|'CONNECTED SOURCE'};
 demand:{current:number;previous:number;evidenceIds:string[]};
 trend:{state:TrendState;changePct:number;evidenceIds:string[]};
 competition:{level:'low'|'medium'|'high'|'missing';value:number|null;evidenceIds:string[]};
 price:{selling:number;breakEven:number;marginPct:number;evidenceIds:string[]};
 audience:{intentScore:number;evidenceIds:string[]};
 problem:{clarity:number;useCase:string;evidenceIds:string[]};
 reviews:{count:number;rating:number;evidenceIds:string[]};
 advertising:{activity:number;evidenceIds:string[]};
 margin:{netProfit:number;marginPct:number;evidenceIds:string[]};
 risk:{level:'low'|'medium'|'high';evidenceIds:string[]};
 seasonality:{state:'unknown'|'not-connected';evidenceIds:string[]};
 lifecycle:{state:'unknown'|'not-connected';evidenceIds:string[]};
 evidenceRefs:string[];
}

export interface OpportunitySignal{
 key:'demand'|'trend'|'buyer-intent'|'margin'|'competition'|'risk'|'evidence-quality';
 label:string;
 state:'Emerging'|'Rising'|'Stable'|'Saturating'|'Declining'|'High Buyer Intent'|'High Margin'|'High Competition'|'High Risk'|'Insufficient Evidence'|'Evidence Ready';
 value:string;
 evidenceIds:string[];
 status:EvidenceStatus;
}
export interface OpportunityRadar{signals:OpportunitySignal[];mode:'transparent signals';}
export interface DataStatus{sourcesConnected:string[];sourcesUnavailable:string[];lastResearchTime:string|null;evidenceCount:number;verifiedEvidenceCount:number;staleEvidenceCount:number;conflictingEvidenceCount:number;}
export interface ResearchRequest{id:string;productQuery:string;missingEvidence:string[];requiredSource?:SourceType;region:string;priority:'FREE/PUBLIC'|'LOW-COST'|'PAID'|'APIFY / EXPENSIVE';estimatedCost:number;status:'queued'|'researching'|'completed'|'blocked'|'missing'|'failed';createdAt:string;}
export interface ResearchProviderCost{sourceName:string;sourceType:SourceType;estimatedCost:number;priority:ResearchRequest['priority'];availability:'available'|'not-connected'|'credential-required';enabled:boolean;}
export interface VerificationReport{verified:EvidenceItem[];duplicates:string[];stale:string[];conflicts:string[];missingClaims:string[];anomalies:string[];}

export interface AnalysisResult{
 profit:{netProfit:number;marginPct:number;breakEvenPrice:number;ordersForDailyTarget:number;targetDailyProfit:number};
 trend:{state:TrendState;demandChangePct:number;explanation:string;evidenceIds:string[]};
 buyerIntent:{score:number;drivers:string[];frictions:string[];evidenceIds:string[]};
 risk:{level:'low'|'medium'|'high';factors:string[];evidenceIds:string[]};
 decision:{label:'test'|'research-first'|'refresh-research';rationale:string[]};
 evidence:EvidenceItem[]; dataStatus:DataStatus; productDNA:ProductDNA; opportunity:OpportunityRadar;
 research:{status:'demo-only'|'ready-to-research';requests:ResearchRequest[];providers:ResearchProviderCost[]};
}
export interface AnalysisRecord{id:string;createdAt:string;productName:string;input:ProductInput;result:AnalysisResult;}
