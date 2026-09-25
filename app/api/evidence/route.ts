import {NextResponse} from 'next/server';
import {analyzeProduct} from '../../../lib/analyzer';
import {demoProduct} from '../../../data/demo';

export async function GET(){
 const result=analyzeProduct(demoProduct);
 return NextResponse.json({ok:true,mode:'DEMO / SIMULATED',evidence:result.evidence,dataStatus:result.dataStatus});
}
