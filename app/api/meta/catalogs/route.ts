import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../lib/sources/meta';
import {metaErrorResponse} from '../utils';

export async function GET(){try{const catalogs=await createMetaAdapter().getCatalogs();return NextResponse.json({ok:true,status:catalogs.length?'CONNECTED':'NOT AVAILABLE',catalogs});}catch(error){return metaErrorResponse(error);}}
