import {NextResponse} from 'next/server';
import {createApifyAdapter,getApifyConfig,ApifyProviderError} from '../../../lib/sources/apify';
import {createResearchRequest,getResearchProviders} from '../../../lib/intelligence/research';
import {createResearchJob,getResearchJob,listResearchJobs,updateResearchJob} from '../../../lib/intelligence/research-jobs';
import type {ResearchJob} from '../../../lib/types';

function safeError(error:unknown){if(error instanceof ApifyProviderError)return{code:error.code,message:error.message};return{code:'unavailable',message:'Research provider failed without a safe diagnostic.'};}

export async function GET(){return NextResponse.json({ok:true,provider:'apify',jobs:listResearchJobs(),providers:getResearchProviders()});}

export async function POST(request:Request){
 try{
  const body=await request.json(); const query=String(body?.productQuery||'').trim();
  if(!query)return NextResponse.json({ok:false,error:'productQuery is required.'},{status:400});
  const provider=String(body?.provider||'apify').toLowerCase(); if(provider!=='apify')return NextResponse.json({ok:false,error:'Only the Apify provider is configured for Day 3.'},{status:400});
  const config=getApifyConfig(); const actorId=String(body?.actorId||config.actorId||'').trim()||undefined; const job=createResearchJob(query,String(body?.region||'User-defined'),actorId); const researchRequest=createResearchRequest(query,Array.isArray(body?.missingEvidence)?body.missingEvidence.map(String):['external demand trend'],'search','APIFY / EXPENSIVE');
  if(body?.execute!==true)return NextResponse.json({ok:true,job,request:researchRequest,providers:getResearchProviders(),message:'Research job queued. Set execute=true to run the configured Apify actor.'});
  updateResearchJob({...job,status:'running',startedAt:new Date().toISOString()});
  try{
   const result=await createApifyAdapter(config).runResearch({query,region:job.region,actorId,input:body?.input&&typeof body.input==='object'?body.input:undefined,job:{...job,status:'running',startedAt:new Date().toISOString()}});
   updateResearchJob(result.job); return NextResponse.json({ok:true,job:result.job,evidence:result.evidence,request:researchRequest,providers:getResearchProviders()});
  }catch(error){
   const diagnostic=safeError(error); const terminalStatus:ResearchJob['status']=diagnostic.code==='missing_credentials'||diagnostic.code==='unavailable'?'blocked':diagnostic.code==='timeout'?'timed-out':'failed'; const failed={...getResearchJob(job.id)||job,status:terminalStatus,errorCode:diagnostic.code,errorMessage:diagnostic.message,completedAt:new Date().toISOString()}; updateResearchJob(failed);
   return NextResponse.json({ok:false,job:failed,error:diagnostic.message,code:diagnostic.code},{status:diagnostic.code==='missing_credentials'?503:502});
  }
 }catch{return NextResponse.json({ok:false,error:'Malformed research request.'},{status:400});}
}
