import {createEvidence,evidenceSummary} from './evidence';
import {buildOpportunityRadar} from './intelligence/opportunity';
import {buildProductDNA} from './intelligence/product-dna';
import {createResearchRequest,researchProviders} from './intelligence/research';
import {calculateTrend} from './intelligence/trend';
import {AnalysisResult,ProductInput} from './types';

const money=(n:number)=>Math.round(n*100)/100;

function buyerIntent(input:ProductInput,evidenceIds:string[]){
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
 return{score,drivers,frictions,evidenceIds};
}

export function analyzeProduct(input:ProductInput):AnalysisResult{
 const totalCost=input.productCost+input.shipping+input.packaging+input.platformFee+input.paymentFee+input.adCost+input.returnCost;
 const netProfit=input.sellingPrice-totalCost;
 const marginPct=input.sellingPrice>0?(netProfit/input.sellingPrice)*100:0;
 const targetDailyProfit=3000; const ordersForDailyTarget=netProfit>0?Math.ceil(targetDailyProfit/netProfit):0;
 const now=new Date().toISOString();
 const evidence=[
  createEvidence({id:'demo-profit-001',claim:'Profit inputs supplied by the user',source:'SELL-AI workspace input',sourceType:'manual',sourceUrl:'internal://workspace/input',sourceId:'workspace-input',region:'User-defined',originalValue:JSON.stringify({sellingPrice:input.sellingPrice,productCost:input.productCost,shipping:input.shipping,packaging:input.packaging,platformFee:input.platformFee,paymentFee:input.paymentFee,adCost:input.adCost,returnCost:input.returnCost}),normalizedValue:`Total modeled cost: Rs. ${money(totalCost)}`,collectedAt:now,status:'verified',confidence:1,metadata:{category:'pricing',tags:['USER INPUT']}}),
  createEvidence({id:'demo-market-001',claim:'Demand and competition signals are user-supplied demo inputs',source:'SELL-AI demo signal layer',sourceType:'demo',sourceUrl:'internal://demo/simulated-signals',sourceId:'demo-signals',region:'User-defined',originalValue:`Demand now ${input.demandNow}; previous ${input.demandPrevious}; competition ${input.competitionNow}`,normalizedValue:`Demand change: ${money(input.demandPrevious<=0?0:((input.demandNow-input.demandPrevious)/input.demandPrevious)*100)}%`,collectedAt:now,status:'unverified',confidence:.35,metadata:{category:'search',tags:['DEMO / SIMULATED'],notes:'No external market provider is connected.'}}),
  createEvidence({id:'demo-buyer-001',claim:'Buyer intent inputs are user-supplied demo signals',source:'SELL-AI demo signal layer',sourceType:'demo',sourceUrl:'internal://demo/simulated-buyer-signals',sourceId:'demo-buyer-signals',region:'User-defined',originalValue:`Reviews ${input.reviewCount}; rating ${input.reviewRating}; trust ${input.trustSignals}`,normalizedValue:'Used only for transparent buyer-intent heuristic.',collectedAt:now,status:'partial',confidence:.35,metadata:{category:'reviews',tags:['DEMO / SIMULATED'],notes:'Review source is not connected.'}}),
 ];
 const trend=calculateTrend(input,evidence);
 const intent=buyerIntent(input,evidence.filter(item=>item.claim.toLowerCase().includes('buyer')).map(item=>item.id));
 const riskFactors:string[]=[];
 if(marginPct<20)riskFactors.push('Low estimated margin.');
 if(input.competitionNow>=75)riskFactors.push('High competition signal.');
 if(trend.state==='declining')riskFactors.push('Demand trend is declining.');
 if(intent.score<55)riskFactors.push('Buyer-intent signals are weak or incomplete.');
 if(input.reviewCount<20)riskFactors.push('Limited review evidence.');
 const risk:AnalysisResult['risk']={level:riskFactors.length>=3?'high':riskFactors.length>=1?'medium':'low',factors:riskFactors.length?riskFactors:['No major risk flag from the supplied inputs.'],evidenceIds:evidence.map(item=>item.id)};
 const label:AnalysisResult['decision']['label']=evidence.some(item=>item.verificationStatus==='unverified')?'research-first':trend.state==='declining'||marginPct<=0?'refresh-research':'test';
 const rationale=[label==='research-first'?'Important buyer or market evidence is marked demo/unverified; collect stronger source data before testing.':label==='refresh-research'?'Current inputs do not support a clean test case yet.':'The supplied evidence supports a controlled market test, subject to source verification.'];
 rationale.push(`Trend state: ${trend.state}. Buyer-intent signal: ${intent.score}/100.`); rationale.push(`Estimated net profit per order: Rs. ${money(netProfit).toLocaleString()}.`);
 const summary=evidenceSummary(evidence);
 const dataStatus={...summary,sourcesConnected:['SELL-AI workspace input'],sourcesUnavailable:['Public search','Marketplace','Social signals','Reviews','Pricing'],lastResearchTime:null};
 const partial={profit:{netProfit:money(netProfit),marginPct:money(marginPct),breakEvenPrice:money(totalCost),ordersForDailyTarget,targetDailyProfit},trend,buyerIntent:intent,risk};
 const productDNA=buildProductDNA(input,partial,evidence);
 const opportunity=buildOpportunityRadar(input,trend,intent.score,marginPct,risk.level,evidence);
 const requests=[createResearchRequest(input.name,['external demand trend','marketplace competition','review source','seasonality'], 'search')];
 return{...partial,decision:{label,rationale},evidence,dataStatus,productDNA,opportunity,research:{status:'demo-only',requests,providers:researchProviders}};
}
