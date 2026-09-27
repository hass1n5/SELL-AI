import {NextResponse} from 'next/server';
import {MetaProviderError} from '../../../lib/sources/meta';

export function errorStatus(code:string){
  if(code==='missing_token'||code==='invalid_configuration')return 503;
  if(code==='invalid_auth'||code==='expired_token')return 401;
  if(code==='permission_denied'||code==='app_review_required')return 403;
  if(code==='rate_limited')return 429;
  if(code==='timeout')return 504;
  return 502;
}

export function metaErrorResponse(error:unknown){
  const providerError=error instanceof MetaProviderError?error:new MetaProviderError('unavailable','Meta request failed.');
  return NextResponse.json({ok:false,status:providerError.code==='missing_token'?'NOT CONNECTED':providerError.code==='permission_denied'?'PERMISSION ERROR':providerError.code==='invalid_auth'||providerError.code==='expired_token'?'AUTH ERROR':providerError.code==='rate_limited'?'RATE LIMITED':'UNAVAILABLE',code:providerError.code,error:providerError.message},{status:errorStatus(providerError.code)});
}

export function text(value:unknown,max=200){return typeof value==='string'&&value.trim().length>0&&value.trim().length<=max?value.trim():undefined;}
