import {NextResponse} from 'next/server';
import {getLatestSeoResearch} from '../../../../lib/intelligence/seo-store';
export async function GET(){const result=getLatestSeoResearch();return NextResponse.json({ok:Boolean(result),result});}
