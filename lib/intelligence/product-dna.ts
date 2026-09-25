import {AnalysisResult,EvidenceItem,ProductDNA,ProductInput} from '../types';
export function buildProductDNA(input:ProductInput,analysis:Pick<AnalysisResult,'profit'|'trend'|'buyerIntent'|'risk'>,evidence:EvidenceItem[]):ProductDNA{
 const refs=(terms:string[])=>evidence.filter(item=>terms.some(term=>item.claim.toLowerCase().includes(term))).map(item=>item.id);
 const competition=input.competitionNow>=75?'high':input.competitionNow>=45?'medium':'low';
 return{
  identity:{name:input.name,category:'Unclassified product',mode:'DEMO / SIMULATED'},
  demand:{current:input.demandNow,previous:input.demandPrevious,evidenceIds:refs(['demand'])},
  trend:{state:analysis.trend.state,changePct:analysis.trend.demandChangePct,evidenceIds:analysis.trend.evidenceIds},
  competition:{level:competition,value:input.competitionNow,evidenceIds:refs(['competition'])},
  price:{selling:input.sellingPrice,breakEven:analysis.profit.breakEvenPrice,marginPct:analysis.profit.marginPct,evidenceIds:refs(['profit','cost'])},
  audience:{intentScore:analysis.buyerIntent.score,evidenceIds:analysis.buyerIntent.evidenceIds},
  problem:{clarity:input.problemClarity,useCase:'User-supplied use case; source research not connected.',evidenceIds:refs(['buyer','problem'])},
  reviews:{count:input.reviewCount,rating:input.reviewRating,evidenceIds:refs(['review','buyer'])},
  advertising:{activity:input.adsNow,evidenceIds:refs(['advertising','demand'])},
  margin:{netProfit:analysis.profit.netProfit,marginPct:analysis.profit.marginPct,evidenceIds:refs(['profit','cost'])},
  risk:{level:analysis.risk.level,evidenceIds:analysis.risk.evidenceIds},
  seasonality:{state:'not-connected',evidenceIds:[]},lifecycle:{state:'not-connected',evidenceIds:[]},evidenceRefs:evidence.map(item=>item.id),
 };
}
