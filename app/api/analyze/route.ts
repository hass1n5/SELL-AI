import {NextResponse} from 'next/server';
import {analyzeProduct} from '../../../lib/analyzer';
import {ProductInput} from '../../../lib/types';
export async function POST(request:Request){try{const body=(await request.json()) as ProductInput;if(!body?.name)return NextResponse.json({error:'Product name is required.'},{status:400});return NextResponse.json({ok:true,result:analyzeProduct(body)});}catch{return NextResponse.json({error:'Invalid analysis payload.'},{status:400});}}