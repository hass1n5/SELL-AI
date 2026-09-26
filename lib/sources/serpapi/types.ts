import type {EvidenceItem,ProviderHealth,VerificationReport} from '../../types';

export type SerpApiEngine='google'|'google_shopping';
export interface SerpApiSearchRequest{query:string;engine?:SerpApiEngine;region?:string;location?:string;country?:string;language?:string;start?:number;num?:number;noCache?:boolean;}
export interface SerpApiRawResult{position?:number;title?:string;link?:string;snippet?:string;price?:string;extracted_price?:number;source?:string;product_id?:string;rating?:number;reviews?:number;thumbnail?:string;[key:string]:unknown;}
export interface SerpApiRawResponse{search_metadata?:{status?:string,id?:string,json_endpoint?:string,created_at?:string,processed_at?:string};search_parameters?:Record<string,unknown>;search_information?:{total_results?:number};organic_results?:SerpApiRawResult[];shopping_results?:SerpApiRawResult[];error?:string;[key:string]:unknown;}
export interface NormalizedSerpApiResult{evidence:EvidenceItem[];verification:VerificationReport;signals:SearchSignals;rawCount:number;engine:SerpApiEngine;query:string;region:string;collectedAt:string;sourceStatus:'success'|'empty';}
export interface SearchSignals{resultCount:number|null;organicResultCount:number;shoppingResultCount:number;rankingPositions:number[];recurringProducts:Array<{value:string;count:number}>;recurringBrands:Array<{value:string;count:number}>;recurringCategories:Array<{value:string;count:number}>;shoppingPresence:boolean;priceRange:{min:number;max:number;currency:string}|null;indicators:string[];}
export interface SerpApiResearchResult extends NormalizedSerpApiResult{cacheHit:boolean;cacheAgeHours:number|null;latencyMs:number;requestId:string;}
export interface SerpApiUsageRecord{requestId:string;timestamp:string;query:string;region:string;engine:SerpApiEngine;success:boolean;latencyMs:number;resultCount:number;errorCode?:string;}
export interface SerpApiHealth extends ProviderHealth{provider:'serpapi';status:'healthy'|'degraded'|'unconfigured'|'unhealthy'|'rate-limited';requestCount:number;lastSuccessfulResearch:string|null;lastError:string|null;}
