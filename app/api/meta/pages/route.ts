import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../lib/sources/meta';
import {metaErrorResponse} from '../utils';

export async function GET(){try{const pages=await createMetaAdapter().getPages();return NextResponse.json({ok:true,status:pages.length?'CONNECTED':'NOT AVAILABLE',pages});}catch(error){return metaErrorResponse(error);}}
