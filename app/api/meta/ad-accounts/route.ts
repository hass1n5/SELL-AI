import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../lib/sources/meta';
import {metaErrorResponse} from '../utils';

export async function GET(){try{const accounts=await createMetaAdapter().getAdAccounts();return NextResponse.json({ok:true,status:accounts.length?'CONNECTED':'NOT AVAILABLE',accounts});}catch(error){return metaErrorResponse(error);}}
