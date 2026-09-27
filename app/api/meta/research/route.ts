import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../lib/sources/meta';
import type {MetaResearchRequest} from '../../../../lib/sources/meta';
import {metaErrorResponse,text} from '../utils';

const capabilities=new Set<MetaResearchRequest['capability']>(['pages','instagram','ads','catalog','ad-library']);

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    const capability=text(body.capability,30) as MetaResearchRequest['capability'];
    if(!capabilities.has(capability))return NextResponse.json({ok:false,error:'A supported Meta capability is required.'},{status:400});
    const result=await createMetaAdapter().research({capability,query:text(body.query,200),region:text(body.region,80),dateStart:text(body.dateStart,30),dateEnd:text(body.dateEnd,30),accountId:text(body.accountId,40),pageId:text(body.pageId,80),catalogId:text(body.catalogId,80),productSetId:text(body.productSetId,80)});
    return NextResponse.json({ok:true,status:result.sourceStatus==='success'?'CONNECTED':'NOT AVAILABLE',result});
  }catch(error){return metaErrorResponse(error);}
}
