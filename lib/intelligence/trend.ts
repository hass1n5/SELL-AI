import {EvidenceItem,ProductInput,TrendState} from '../types';

export interface TrendSignal{state:TrendState;demandChangePct:number;explanation:string;evidenceIds:string[];}
export function calculateTrend(input:ProductInput,evidence:EvidenceItem[]):TrendSignal{
 const change=input.demandPrevious<=0?0:((input.demandNow-input.demandPrevious)/input.demandPrevious)*100;
 let state:TrendState='stable'; let explanation='Demand is currently moving within a stable range.';
 if(change>=25&&input.competitionNow<70){state='rising';explanation='Demand is increasing materially while competition is not yet dominant.';}
 else if(change>=25){state='saturating';explanation='Demand is rising, but competition is also elevated.';}
 else if(change<=-25){state='declining';explanation='Current demand is materially below the previous period.';}
 else if(input.demandNow<35&&input.competitionNow<30){state='emerging';explanation='The signal base is still small, but competition is also low.';}
 const evidenceIds=evidence.filter(item=>item.claim.toLowerCase().includes('demand')||item.claim.toLowerCase().includes('competition')).map(item=>item.id);
 return{state,demandChangePct:Math.round(change*100)/100,explanation,evidenceIds};
}
