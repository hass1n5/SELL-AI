import {NextResponse} from 'next/server';
import {createResearchRequest,researchProviders} from '../../../lib/intelligence/research';

export async function POST(request:Request){
 try{
  const body=await request.json(); const query=String(body?.productQuery||'').trim();
  if(!query)return NextResponse.json({ok:false,error:'productQuery is required.'},{status:400});
  const missingEvidence=Array.isArray(body?.missingEvidence)?body.missingEvidence.map(String):['external demand trend'];
  const requestModel=createResearchRequest(query,missingEvidence,body?.requiredSource);
  return NextResponse.json({ok:true,request:requestModel,providers:researchProviders,mode:'DEMO / SIMULATED'});
 }catch{return NextResponse.json({ok:false,error:'Malformed research request.'},{status:400});}
}
