import assert from 'node:assert/strict';
import test from 'node:test';
import {demoProduct} from '../data/demo';
import {analyzeProduct} from '../lib/analyzer';
import {createEvidence,calculateFreshness,verifyEvidence} from '../lib/evidence';
import {buildOpportunityRadar} from '../lib/intelligence/opportunity';
import {calculateTrend} from '../lib/intelligence/trend';

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
