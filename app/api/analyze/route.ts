import {NextResponse} from 'next/server';
import {analyzeProduct} from '../../../lib/analyzer';
import {ProductInput} from '../../../lib/types';
const numericFields:(keyof ProductInput)[]=['sellingPrice','productCost','shipping','packaging','platformFee','paymentFee','adCost','returnCost','demandNow','demandPrevious','competitionNow','adsNow','reviewCount','reviewRating','trustSignals','problemClarity','visualAppeal'];
export async function POST(request:Request){
 try{
  const body=await request.json() as ProductInput;
  if(!body||typeof body.name!=='string'||!body.name.trim())return NextResponse.json({ok:false,error:'Product name is required.'},{status:400});
  if(numericFields.some(field=>typeof body[field]!=='number'||!Number.isFinite(body[field] as number)))return NextResponse.json({ok:false,error:'All product metrics must be finite numbers.'},{status:400});
  return NextResponse.json({ok:true,result:analyzeProduct(body)});
 }catch{return NextResponse.json({ok:false,error:'Invalid analysis payload.'},{status:400});}
}
