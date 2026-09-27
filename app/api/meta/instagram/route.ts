import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../lib/sources/meta';
import {metaErrorResponse} from '../utils';

export async function GET(){try{const adapter=createMetaAdapter();const account=await adapter.getInstagram();return NextResponse.json({ok:true,status:'CONNECTED',account});}catch(error){return metaErrorResponse(error);}}
