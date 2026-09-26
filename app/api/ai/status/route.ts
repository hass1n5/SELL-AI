import {NextResponse} from 'next/server';
import {GeminiClient} from '../../../../lib/ai/gemini/client';
import {getGeminiUsageSummary} from '../../../../lib/ai/gemini/usage';

export async function GET(){const status=await new GeminiClient().verifyAuthentication();const usage=getGeminiUsageSummary();return NextResponse.json({ok:status.status==='CONNECTED',status:{...status,...usage}});}
