import {NextResponse} from 'next/server';
import {createGoogleAdsAdapter} from '../../../../lib/sources/google-ads';
export async function GET(){const health=await createGoogleAdsAdapter().verifyAuthentication();return NextResponse.json({ok:health.status==='healthy'||health.status==='degraded',health},{status:health.status==='unhealthy'?401:200});}
