import {NextResponse} from 'next/server';
import {verifyEvidence} from '../../../../lib/evidence';
import {EvidenceItem} from '../../../../lib/types';

export async function POST(request:Request){
 try{
  const body=await request.json();
  if(!Array.isArray(body?.evidence))return NextResponse.json({ok:false,error:'evidence must be an array.'},{status:400});
  return NextResponse.json({ok:true,report:verifyEvidence(body.evidence as EvidenceItem[],Array.isArray(body.requiredClaims)?body.requiredClaims:[])});
 }catch{return NextResponse.json({ok:false,error:'Malformed evidence payload.'},{status:400});}
}
