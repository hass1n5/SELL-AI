import {analyzeProduct} from '../analyzer';
import type {AnalysisResult,ProductInput} from '../types';
export function parseAiRequest(body:unknown):{product:ProductInput;result:AnalysisResult;region:string}|{error:string}{
 const source=body&&typeof body==='object'?body as Record<string,unknown>:{};const product=(source.product||source.input) as Partial<ProductInput>|undefined;
 if(!product||typeof product.name!=='string'||!product.name.trim())return{error:'product is required.'};
 const numericFields=['sellingPrice','productCost','shipping','packaging','platformFee','paymentFee','adCost','returnCost','demandNow','demandPrevious','competitionNow','adsNow','reviewCount','reviewRating','trustSignals','problemClarity','visualAppeal'] as const;
 if(numericFields.some(field=>typeof product[field]!=='number'||!Number.isFinite(product[field] as number)))return{error:'product metrics must be finite numbers.'};
 const normalized=product as ProductInput;return{product:normalized,result:analyzeProduct(normalized),region:typeof source.region==='string'&&source.region.trim()?source.region:'User-defined'};
}
