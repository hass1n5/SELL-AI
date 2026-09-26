import {NextResponse} from 'next/server';
import {parseAiRequest} from '../../../../lib/ai/request';
import {buildAnalystInput,buildFallbackReport,generateGeminiReport} from '../../../../lib/ai/gemini/analyst';
import {GeminiProviderError,getGeminiConfig,GeminiClient} from '../../../../lib/ai/gemini/client';

function errorStatus(code:string){return code==='missing_key'?503:code==='invalid_key'?401:code==='rate_limited'||code==='quota_exceeded'?429:502;}
export async function POST(request:Request){
 try{
  const parsed=parseAiRequest(await request.json());if('error' in parsed)return NextResponse.json({ok:false,error:parsed.error},{status:400});
  const input=buildAnalystInput(parsed.product,parsed.result,parsed.region);const config=getGeminiConfig();
  if(!config.apiKey)return NextResponse.json({ok:false,status:'NOT CONNECTED',message:'Gemini Not Connected',report:buildFallbackReport(input,config.model)},{status:503});
  const report=await generateGeminiReport(input,new GeminiClient(config));return NextResponse.json({ok:true,status:'CONNECTED',report});
 }catch(error){const providerError=error instanceof GeminiProviderError?error:new GeminiProviderError('unavailable','Gemini report failed.');return NextResponse.json({ok:false,status:'NOT CONNECTED',code:providerError.code,error:providerError.message},{status:errorStatus(providerError.code)});}
}
