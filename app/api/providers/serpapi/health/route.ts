import {NextResponse} from 'next/server';
import {createSerpApiAdapter} from '../../../../../lib/sources/serpapi';

export async function GET(){const health=await createSerpApiAdapter().verifyAuthentication();return NextResponse.json({ok:health.status==='healthy',health},{status:health.status==='unhealthy'?401:200});}
