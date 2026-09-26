import {NextResponse} from 'next/server';
import {createApifyAdapter} from '../../../../../lib/sources/apify';

export async function GET(){
 const health=await createApifyAdapter().verifyAuthentication();
 return NextResponse.json({ok:health.status==='healthy',health},{status:health.status==='unhealthy'?502:200});
}
