import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../../lib/sources/meta';
import {metaErrorResponse,text} from '../../utils';

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    const result=await createMetaAdapter().research({capability:'ads',region:text(body.region,80),dateStart:text(body.dateStart,30),dateEnd:text(body.dateEnd,30),accountId:text(body.accountId,40)});
    return NextResponse.json({ok:true,status:result.sourceStatus==='success'?'CONNECTED':'NOT AVAILABLE',result});
  }catch(error){return metaErrorResponse(error);}
}
