import {NextResponse} from 'next/server';
import {getResearchJob} from '../../../../lib/intelligence/research-jobs';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params; const job=getResearchJob(id); if(!job)return NextResponse.json({ok:false,error:'Research job not found.'},{status:404}); return NextResponse.json({ok:true,job});
}
