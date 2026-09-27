import {NextResponse} from 'next/server';
import {createMetaAdapter} from '../../../../lib/sources/meta';

export async function GET(){
  const health=await createMetaAdapter().verifyAuthentication();
  return NextResponse.json({ok:health.status==='healthy'||health.status==='degraded',health},{status:health.status==='unhealthy'?401:200});
}
