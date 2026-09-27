import type {EvidenceItem,FreshnessState,ProviderHealth,VerificationReport} from '../../types';

export type MetaErrorCode=
  | 'missing_token'|'invalid_auth'|'expired_token'|'permission_denied'|'app_review_required'
  | 'rate_limited'|'quota_exhausted'|'timeout'|'unavailable'|'malformed_response'
  | 'invalid_configuration'|'empty_results';

export class MetaProviderError extends Error{
  constructor(public readonly code:MetaErrorCode,message:string,public readonly status?:number){
    super(message); this.name='MetaProviderError';
  }
}

export interface MetaConfig{
  accessToken?:string;
  appId?:string;
  appSecret?:string;
  businessId?:string;
  adAccountId?:string;
  pageId?:string;
  instagramAccountId?:string;
  baseUrl:string;
  apiVersion:string;
  timeoutMs:number;
  maxRetries:number;
}

export type MetaCapabilityKey='facebook'|'instagram'|'ads'|'catalog'|'adLibrary';
export type MetaCapabilityStatus='connected'|'not_connected'|'auth_error'|'permission_error'|'rate_limited'|'unavailable';

export interface MetaCapabilityHealth{
  capability:MetaCapabilityKey;
  status:MetaCapabilityStatus;
  message:string;
  checkedAt:string;
  latencyMs?:number;
  count?:number;
  lastError?:MetaErrorCode|null;
}

export interface MetaHealth extends Omit<ProviderHealth,'provider'|'status'>{
  provider:'meta';
  status:'healthy'|'unconfigured'|'unhealthy'|'degraded'|'rate-limited';
  userId?:string;
  userName?:string;
  capabilities:Record<MetaCapabilityKey,MetaCapabilityHealth>;
}

export interface MetaUser{ id:string; name?:string; }
export interface MetaPage{ id:string; name?:string; category?:string; link?:string; fanCount?:number|null; followersCount?:number|null; raw:Record<string,unknown>; }
export interface MetaAdAccount{ id:string; name?:string; accountStatus?:number|null; currency?:string; timezoneName?:string; amountSpent?:number|null; raw:Record<string,unknown>; }
export interface MetaCampaign{ id:string; name?:string; status?:string; effectiveStatus?:string; raw:Record<string,unknown>; }
export interface MetaAdSet{ id:string; name?:string; status?:string; campaignId?:string; raw:Record<string,unknown>; }
export interface MetaAd{ id:string; name?:string; status?:string; adSetId?:string; creative?:Record<string,unknown>; raw:Record<string,unknown>; }
export interface MetaInsight{ accountId?:string; campaignId?:string; adSetId?:string; adId?:string; dateStart?:string; dateStop?:string; metrics:Record<string,number|string|null>; raw:Record<string,unknown>; }
export interface MetaCatalog{ id:string; name?:string; productCount?:number|null; raw:Record<string,unknown>; }
export interface MetaProductSet{ id:string; name?:string; productCount?:number|null; raw:Record<string,unknown>; }
export interface MetaProductItem{ id:string; name?:string; availability?:string; price?:string; url?:string; raw:Record<string,unknown>; }
export interface MetaInstagramAccount{ id:string; username?:string; name?:string; profilePictureUrl?:string; followersCount?:number|null; mediaCount?:number|null; raw:Record<string,unknown>; }
export interface MetaInstagramMedia{ id:string; caption?:string; mediaType?:string; permalink?:string; timestamp?:string; likeCount?:number|null; commentsCount?:number|null; raw:Record<string,unknown>; }
export interface MetaCreative{ id?:string; type?:string; body?:string; title?:string; linkUrl?:string; callToAction?:string; mediaUrl?:string; raw:Record<string,unknown>; }

export interface MetaResearchRequest{
  capability:'pages'|'instagram'|'ads'|'catalog'|'ad-library';
  query?:string;
  region?:string;
  dateStart?:string;
  dateEnd?:string;
  accountId?:string;
  pageId?:string;
  catalogId?:string;
  productSetId?:string;
}

export interface MetaResearchResult{
  capability:MetaResearchRequest['capability'];
  evidence:EvidenceItem[];
  verification:VerificationReport;
  sourceStatus:'success'|'empty'|'permission-denied'|'unavailable';
  collectedAt:string;
  latencyMs:number;
  counts:Record<string,number>;
  data?:Record<string,unknown>;
}

export interface MetaEvidenceSummary{
  evidenceId:string;
  claim:string;
  source:string;
  sourceType:EvidenceItem['sourceType'];
  sourceReference:string;
  collectedAt:string;
  region:string;
  originalValue:string;
  normalizedValue:string;
  freshness:FreshnessState;
  verificationStatus:EvidenceItem['verificationStatus'];
  confidence:number;
}
