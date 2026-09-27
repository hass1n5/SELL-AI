import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../../lib/sources/meta';
import {metaErrorResponse,text} from '../../utils';

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    const result=await createMetaAdapter().research({capability:'catalog',region:text(body.region,80),catalogId:text(body.catalogId,80),productSetId:text(body.productSetId,80)});
    return NextResponse.json({ok:true,status:result.sourceStatus==='success'?'CONNECTED':'NOT AVAILABLE',result});
  }catch(error){return metaErrorResponse(error);}
}
