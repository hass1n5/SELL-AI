import {NextResponse} from 'next/server';
import {parseAiRequest} from '../../../../lib/ai/request';
import {answerWithGemini,buildAnalystInput} from '../../../../lib/ai/gemini/analyst';
import {GeminiProviderError,getGeminiConfig,GeminiClient} from '../../../../lib/ai/gemini/client';

function errorStatus(code:string){return code==='missing_key'?503:code==='invalid_key'?401:code==='rate_limited'||code==='quota_exceeded'?429:502;}
export async function POST(request:Request){
 try{
  const body=await request.json() as Record<string,unknown>;const question=typeof body.question==='string'?body.question.trim():'';if(!question)return NextResponse.json({ok:false,error:'question is required.'},{status:400});
  const parsed=parseAiRequest(body);if('error' in parsed)return NextResponse.json({ok:false,error:parsed.error},{status:400});const input=buildAnalystInput(parsed.product,parsed.result,parsed.region);const config=getGeminiConfig();
  if(!config.apiKey)return NextResponse.json({ok:false,status:'NOT CONNECTED',message:'Gemini Not Connected',answer:{claim:'Insufficient evidence.',status:'INSUFFICIENT EVIDENCE',evidenceIds:[]},researchGaps:input.researchGaps},{status:503});
  const response=await answerWithGemini(input,question,new GeminiClient(config));return NextResponse.json({ok:true,status:'CONNECTED',...response});
 }catch(error){const providerError=error instanceof GeminiProviderError?error:new GeminiProviderError('unavailable','Gemini chat failed.');return NextResponse.json({ok:false,status:'NOT CONNECTED',code:providerError.code,error:providerError.message},{status:errorStatus(providerError.code)});}
}
