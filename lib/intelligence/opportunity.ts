import {EvidenceItem,OpportunityRadar,OpportunitySignal,ProductInput} from '../types';
import {TrendSignal} from './trend';

export function buildOpportunityRadar(input:ProductInput,trend:TrendSignal,buyerScore:number,marginPct:number,riskLevel:'low'|'medium'|'high',evidence:EvidenceItem[]):OpportunityRadar{
 const quality=evidence.length?evidence.filter(item=>item.verificationStatus==='verified'||item.verificationStatus==='partial').length/evidence.length:0;
 const refs=(terms:string[])=>evidence.filter(item=>terms.some(term=>item.claim.toLowerCase().includes(term))).map(item=>item.id);
 const signals:OpportunitySignal[]=[
  {key:'demand',label:'Demand',state:(input.demandNow<35?'Emerging':input.demandNow>=70?'Rising':'Stable'),value:`${input.demandNow}/100`,evidenceIds:refs(['demand']),status:'partial'},
  {key:'trend' as const,label:'Trend',state:trend.state.charAt(0).toUpperCase()+trend.state.slice(1) as OpportunityRadar['signals'][number]['state'],value:`${trend.demandChangePct>=0?'+':''}${trend.demandChangePct}%`,evidenceIds:trend.evidenceIds,status:'partial' as const},
  {key:'buyer-intent',label:'Buyer intent',state:buyerScore>=70?'High Buyer Intent':'Insufficient Evidence',value:`${buyerScore}/100`,evidenceIds:refs(['buyer','review','trust']),status:buyerScore>=70?'partial':'missing'},
  {key:'margin',label:'Margin',state:marginPct>=30?'High Margin':'Insufficient Evidence',value:`${Math.round(marginPct*100)/100}%`,evidenceIds:refs(['profit','margin','cost']),status:'verified'},
  {key:'competition',label:'Competition',state:input.competitionNow>=75?'High Competition':'Insufficient Evidence',value:`${input.competitionNow}/100`,evidenceIds:refs(['competition']),status:'partial'},
  {key:'risk',label:'Risk',state:riskLevel==='high'?'High Risk':'Evidence Ready',value:riskLevel,evidenceIds:refs(['risk','review','competition']),status:riskLevel==='high'?'partial':'verified'},
  {key:'evidence-quality',label:'Evidence quality',state:quality>=0.75?'Evidence Ready':'Insufficient Evidence',value:`${Math.round(quality*100)}% usable`,evidenceIds:evidence.map(item=>item.id),status:quality>=0.75?'partial':'missing'},
 ];
 return{signals,mode:'transparent signals'};
}
