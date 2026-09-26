import {NextResponse} from 'next/server';
import {SerpApiError,createSerpApiAdapter} from '../../../../lib/sources/serpapi';

function errorStatus(code:string){return code==='missing_key'?503:code==='invalid_key'?401:code==='rate_limited'?429:code==='quota_exhausted'?402:code==='timeout'?504:502;}
export async function POST(request:Request){
 try{
  const body=await request.json();const query=typeof body?.query==='string'?body.query.trim():'';if(!query)return NextResponse.json({ok:false,error:'query is required.'},{status:400});
  const source=String(body?.source||'serpapi').toLowerCase();if(source!=='serpapi')return NextResponse.json({ok:false,error:'Only the SerpApi search provider is configured for this endpoint.'},{status:400});
  const engine=body?.engine==='google_shopping'?'google_shopping':'google';const region=typeof body?.region==='string'&&body.region.trim()?body.region.trim():'Unspecified';const result=await createSerpApiAdapter().research({query,region,engine,location:typeof body?.location==='string'?body.location:undefined,country:typeof body?.country==='string'?body.country:undefined,language:typeof body?.language==='string'?body.language:undefined,noCache:body?.noCache===true});return NextResponse.json({ok:true,status:'CONNECTED',source:'serpapi',...result});
 }catch(error){const apiError=error instanceof SerpApiError?error:new SerpApiError('unavailable','SerpApi research failed.');return NextResponse.json({ok:false,status:apiError.code==='missing_key'?'NOT CONNECTED':apiError.code==='rate_limited'?'RATE LIMITED':'ERROR',code:apiError.code,error:apiError.message},{status:errorStatus(apiError.code)});}
}
