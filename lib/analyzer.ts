import {AnalysisResult,ProductInput,TrendState,EvidenceItem} from './types';
const money=(n:number)=>Math.round(n*100)/100;
function trendState(input:ProductInput){
 const change=input.demandPrevious<=0?0:((input.demandNow-input.demandPrevious)/input.demandPrevious)*100;
 if(change>=25&&input.competitionNow<70)return{state:'rising' as TrendState,change,explanation:'Demand is increasing materially while competition is not yet dominant.'};
 if(change>=25)return{state:'saturating' as TrendState,change,explanation:'Demand is rising, but competition is also elevated.'};
 if(change<=-25)return{state:'declining' as TrendState,change,explanation:'Current demand is materially below the previous period.'};
 if(input.demandNow<35&&input.competitionNow<30)return{state:'emerging' as TrendState,change,explanation:'The signal base is still small, but competition is also low.'};
 return{state:'stable' as TrendState,change,explanation:'Demand is currently moving within a stable range.'};
}
function buyerIntent(input:ProductInput){
 const score=Math.round(Math.min(100,input.trustSignals*.22+input.problemClarity*.24+input.visualAppeal*.18+Math.min(100,input.reviewCount/10)*.16+Math.min(100,input.reviewRating*20)*.20));
 const drivers:string[]=[]; const frictions:string[]=[];
 if(input.problemClarity>=70)drivers.push('The problem/use-case is easy to understand.');
 if(input.visualAppeal>=70)drivers.push('The product has strong visual/demo potential.');
 if(input.reviewRating>=4.2)drivers.push('Review rating supports trust.');
 if(input.reviewCount<30)frictions.push('Low review volume reduces social proof.');
 if(input.trustSignals<60)frictions.push('Trust signals need strengthening.');
 if(input.sellingPrice>=5000)frictions.push('Higher ticket size can increase price resistance.');
 if(!drivers.length)drivers.push('No single buyer-intent driver dominates yet.');
 if(!frictions.length)frictions.push('No major purchase friction detected from supplied inputs.');
 return{score,drivers,frictions};
}
export function analyzeProduct(input:ProductInput):AnalysisResult{
 const totalCost=input.productCost+input.shipping+input.packaging+input.platformFee+input.paymentFee+input.adCost+input.returnCost;
 const netProfit=input.sellingPrice-totalCost;
 const marginPct=input.sellingPrice>0?(netProfit/input.sellingPrice)*100:0;
 const targetDailyProfit=3000; const ordersForDailyTarget=netProfit>0?Math.ceil(targetDailyProfit/netProfit):0;
 const trend=trendState(input); const intent=buyerIntent(input); const riskFactors:string[]=[];
 if(marginPct<20)riskFactors.push('Low estimated margin.');
 if(input.competitionNow>=75)riskFactors.push('High competition signal.');
 if(trend.state==='declining')riskFactors.push('Demand trend is declining.');
 if(intent.score<55)riskFactors.push('Buyer-intent signals are weak or incomplete.');
 if(input.reviewCount<20)riskFactors.push('Limited review evidence.');
 const risk:AnalysisResult['risk']={level:riskFactors.length>=3?'high':riskFactors.length>=1?'medium':'low',factors:riskFactors.length?riskFactors:['No major risk flag from the supplied inputs.']};
 const rationale:string[]=[]; let label:AnalysisResult['decision']['label']; const evidenceMissing=input.reviewCount===0||input.trustSignals===0;
 if(evidenceMissing){label='research-first';rationale.push('Important buyer evidence is missing; collect stronger source data before testing.');}
 else if(trend.state==='declining'||marginPct<=0){label='refresh-research';rationale.push('Current inputs do not support a clean test case yet.');}
 else{label='test';rationale.push('The supplied evidence supports a controlled market test, subject to source verification.');}
 rationale.push(`Trend state: ${trend.state}. Buyer-intent signal: ${intent.score}/100.`); rationale.push(`Estimated net profit per order: Rs. ${money(netProfit).toLocaleString()}.`);
 const now=new Date().toISOString(); const evidence:EvidenceItem[]=[
 {id:'local-input-001',claim:'Profit inputs supplied by the user',source:'SELL-AI workspace input',sourceUrl:'internal://workspace/input',timestamp:now,region:'User-defined',originalValue:JSON.stringify({sellingPrice:input.sellingPrice,productCost:input.productCost,shipping:input.shipping}),normalizedValue:`Total modeled cost: Rs. ${money(totalCost)}`,freshnessHours:0,status:'verified'},
 {id:'local-signal-001',claim:'Demand and competition signals are user-supplied demo inputs',source:'SELL-AI demo signal layer',sourceUrl:'internal://workspace/signals',timestamp:now,region:'User-defined',originalValue:`Demand now ${input.demandNow}; previous ${input.demandPrevious}; competition ${input.competitionNow}`,normalizedValue:`Demand change: ${money(trend.change)}%`,freshnessHours:0,status:'partial'}];
 return{profit:{netProfit:money(netProfit),marginPct:money(marginPct),breakEvenPrice:money(totalCost),ordersForDailyTarget,targetDailyProfit},trend:{state:trend.state,demandChangePct:money(trend.change),explanation:trend.explanation},buyerIntent:intent,risk,decision:{label,rationale},evidence};
}