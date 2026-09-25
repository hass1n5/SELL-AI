export type TrendState='emerging'|'rising'|'stable'|'saturating'|'declining';
export type EvidenceStatus='verified'|'partial'|'stale'|'conflict'|'missing';
export interface EvidenceItem{ id:string; claim:string; source:string; sourceUrl:string; timestamp:string; region:string; originalValue:string; normalizedValue?:string; freshnessHours:number; status:EvidenceStatus; }
export interface ProductInput{
 name:string; sellingPrice:number; productCost:number; shipping:number; packaging:number; platformFee:number; paymentFee:number; adCost:number; returnCost:number;
 demandNow:number; demandPrevious:number; competitionNow:number; adsNow:number; reviewCount:number; reviewRating:number; trustSignals:number; problemClarity:number; visualAppeal:number;
}
export interface AnalysisResult{
 profit:{netProfit:number;marginPct:number;breakEvenPrice:number;ordersForDailyTarget:number;targetDailyProfit:number};
 trend:{state:TrendState;demandChangePct:number;explanation:string};
 buyerIntent:{score:number;drivers:string[];frictions:string[]};
 risk:{level:'low'|'medium'|'high';factors:string[]};
 decision:{label:'test'|'research-first'|'refresh-research';rationale:string[]};
 evidence:EvidenceItem[];
}