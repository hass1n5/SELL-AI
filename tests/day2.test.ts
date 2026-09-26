import assert from 'node:assert/strict';
import test from 'node:test';
import {demoProduct} from '../data/demo';
import {analyzeProduct} from '../lib/analyzer';
import {createEvidence,calculateFreshness,verifyEvidence} from '../lib/evidence';
import {buildOpportunityRadar} from '../lib/intelligence/opportunity';
import {calculateTrend} from '../lib/intelligence/trend';
import {ApifyProviderAdapter} from '../lib/sources/apify';

const evidence=(id:string,value:string,sourceId='source-a')=>createEvidence({id,claim:'Demand signal',source:'Test source',sourceType:'search',sourceUrl:'https://example.test/source',sourceId,region:'PK',originalValue:value,normalizedValue:value,status:'unverified',confidence:.5},new Date('2026-01-01T00:00:00.000Z'));

test('freshness calculation supports fresh, aging, stale, and expired states',()=>{
 const now=new Date('2026-01-08T00:00:00.000Z');
 assert.equal(calculateFreshness('2026-01-07T23:00:00.000Z',now).state,'fresh');
 assert.equal(calculateFreshness('2026-01-06T00:00:00.000Z',now).state,'aging');
 assert.equal(calculateFreshness('2026-01-04T00:00:00.000Z',now).state,'stale');
 assert.equal(calculateFreshness('2025-12-01T00:00:00.000Z',now).state,'expired');
});

test('profit output is linked to evidence and Product DNA',()=>{
 const result=analyzeProduct(demoProduct);
 assert.equal(result.evidence.length>=3,true);
 assert.equal(result.productDNA.margin.netProfit,result.profit.netProfit);
 assert.deepEqual(result.productDNA.evidenceRefs,result.evidence.map(item=>item.id));
});

test('trend state exposes evidence references',()=>{
 const result=analyzeProduct(demoProduct);
 assert.equal(result.trend.state,'rising');
 assert.equal(result.trend.evidenceIds.length>0,true);
 assert.equal(calculateTrend(demoProduct,result.evidence).state,'rising');
});

test('verification detects duplicates, stale records, conflicts, and missing claims',()=>{
 const first=evidence('one','76');
 const duplicate=evidence('two','76');
 const conflict=evidence('three','12','source-b');
 const report=verifyEvidence([first,duplicate,conflict],['Demand signal','Price signal']);
 assert.deepEqual(report.duplicates,['two']);
 assert.deepEqual(report.conflicts,['one','two','three']);
 assert.deepEqual(report.missingClaims,['Price signal']);
 assert.equal(report.stale.length,3);
});

test('opportunity radar returns transparent signal states with evidence references',()=>{
 const result=analyzeProduct(demoProduct);
 const radar=buildOpportunityRadar(demoProduct,result.trend,result.buyerIntent.score,result.profit.marginPct,result.risk.level,result.evidence);
 assert.equal(radar.mode,'transparent signals');
 assert.equal(radar.signals.length,7);
 assert.equal(radar.signals.every(signal=>Array.isArray(signal.evidenceIds)),true);
});

test('Apify adapter verifies auth, retries transient responses, and ingests dataset evidence',async()=>{
 const originalFetch=globalThis.fetch; let calls=0;
 globalThis.fetch=(async(input,init)=>{
  calls+=1; const url=String(input); const headers=new Headers(init?.headers);
  assert.equal(headers.get('Authorization'),'Bearer test-token');
  if(url.endsWith('/users/me')&&calls===1)return new Response('temporary', {status:503});
  if(url.endsWith('/users/me'))return new Response(JSON.stringify({data:{id:'user'}}),{status:200});
  if(url.includes('/actors/actor/runs'))return new Response(JSON.stringify({data:{id:'run-1',status:'RUNNING',defaultDatasetId:'dataset-1'}}),{status:201});
  if(url.includes('/actor-runs/run-1'))return new Response(JSON.stringify({data:{id:'run-1',status:'SUCCEEDED',defaultDatasetId:'dataset-1'}}),{status:200});
  if(url.includes('/datasets/dataset-1/items'))return new Response(JSON.stringify([{title:'unverified result'}]),{status:200});
  return new Response('not found',{status:404});
 }) as typeof fetch;
 try{
  const adapter=new ApifyProviderAdapter({token:'test-token',actorId:'actor',baseUrl:'https://api.example.test/v2',timeoutMs:1000,maxRetries:1,pollIntervalMs:1,maxPolls:2});
  const health=await adapter.verifyAuthentication(); assert.equal(health.status,'healthy');
  const job={id:'job-1',provider:'apify' as const,query:'test product',region:'PK',actorId:'actor',status:'running' as const,createdAt:new Date().toISOString(),evidenceCount:0};
  const result=await adapter.runResearch({query:'test product',region:'PK',job});
  assert.equal(result.job.status,'completed'); assert.equal(result.evidence.length,1); assert.equal(result.evidence[0].sourceType,'search'); assert.equal(result.evidence[0].verificationStatus,'unverified'); assert.equal(calls>=5,true);
 }finally{globalThis.fetch=originalFetch;}
});

test('Apify health reports unconfigured without a secret',async()=>{
 const adapter=new ApifyProviderAdapter({actorId:'actor',baseUrl:'https://api.example.test/v2',timeoutMs:1000,maxRetries:0,pollIntervalMs:1,maxPolls:1});
 const health=await adapter.verifyAuthentication(); assert.equal(health.status,'unconfigured'); assert.equal(health.actorConfigured,true);
});
