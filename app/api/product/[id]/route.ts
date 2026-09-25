import {NextResponse} from 'next/server';
import {analyzeProduct} from '../../../../lib/analyzer';
import {demoProduct} from '../../../../data/demo';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(id!=='demo')return NextResponse.json({ok:false,error:'Product is not connected to a persistent store.'},{status:404});
 const result=analyzeProduct(demoProduct);
 return NextResponse.json({ok:true,id,mode:'DEMO / SIMULATED',productDNA:result.productDNA,opportunity:result.opportunity});
}
