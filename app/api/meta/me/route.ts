import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../lib/sources/meta';
import {metaErrorResponse} from '../utils';

export async function GET(){try{return NextResponse.json({ok:true,user:await createMetaAdapter().getMe()});}catch(error){return metaErrorResponse(error);}}
