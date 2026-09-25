"use client";

import {useEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {demoProduct} from '../data/demo';
import type {AnalysisRecord,AnalysisResult,ProductInput} from '../lib/types';

const HISTORY_KEY='sell-ai:analysis-history';
const MAX_HISTORY=8;
function readHistory():AnalysisRecord[]{
 if(typeof window==='undefined')return[];
 try{const value=JSON.parse(window.localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return[];}
}
function writeHistory(value:AnalysisRecord[]){if(typeof window==='undefined')return;try{window.localStorage.setItem(HISTORY_KEY,JSON.stringify(value));}catch{/* Browser storage is optional. */}}

export default function Analyzer(){
 const[product,setProduct]=useState<ProductInput>(demoProduct);
 const[result,setResult]=useState<AnalysisResult|null>(null);
 const[history,setHistory]=useState<AnalysisRecord[]>([]);
 const[activeHistoryId,setActiveHistoryId]=useState<string|null>(null);
 const[loading,setLoading]=useState(false); const[error,setError]=useState('');
 useEffect(()=>setHistory(readHistory()),[]);
 const set=(key:keyof ProductInput,value:string)=>setProduct(previous=>({...previous,[key]:key==='name'?value:Number(value)}));
 const saveRecord=(next:AnalysisRecord)=>setHistory(current=>{const updated=[next,...current.filter(item=>item.id!==next.id)].slice(0,MAX_HISTORY);writeHistory(updated);return updated;});
 async function analyze(){
  setLoading(true);setError('');
  try{
   const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(product)});
   const json=await response.json();
   if(!response.ok||!json.ok){setError(json.error||'Analysis failed.');return;}
   const nextResult=json.result as AnalysisResult;
   const record:AnalysisRecord={id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}`,createdAt:new Date().toISOString(),productName:product.name.trim()||'Untitled product',input:product,result:nextResult};
   setResult(nextResult);setActiveHistoryId(record.id);saveRecord(record);
  }catch{setError('Could not reach the analysis engine.');}finally{setLoading(false);}
 }
 function restore(record:AnalysisRecord){setProduct(record.input);setResult(record.result);setActiveHistoryId(record.id);setError('');}
 function clearHistory(){setHistory([]);setActiveHistoryId(null);writeHistory([]);}
 return <div className="workspace">
  <section className="panel input-panel">
   <div className="section-head"><div><span className="eyebrow">PRODUCT INTELLIGENCE</span><h2>Analyze a product</h2></div><span className="status-dot">● live engine</span></div>
   <label>Product name<input value={product.name} onChange={event=>set('name',event.target.value)}/></label>
   <div className="grid-2"><Field label="Selling price" value={product.sellingPrice} onChange={value=>set('sellingPrice',value)}/><Field label="Product cost" value={product.productCost} onChange={value=>set('productCost',value)}/><Field label="Shipping" value={product.shipping} onChange={value=>set('shipping',value)}/><Field label="Packaging" value={product.packaging} onChange={value=>set('packaging',value)}/><Field label="Platform fee" value={product.platformFee} onChange={value=>set('platformFee',value)}/><Field label="Payment fee" value={product.paymentFee} onChange={value=>set('paymentFee',value)}/><Field label="Ad cost / order" value={product.adCost} onChange={value=>set('adCost',value)}/><Field label="Return cost / order" value={product.returnCost} onChange={value=>set('returnCost',value)}/><Field label="Demand now (0–100)" value={product.demandNow} onChange={value=>set('demandNow',value)}/><Field label="Demand previous (0–100)" value={product.demandPrevious} onChange={value=>set('demandPrevious',value)}/><Field label="Competition (0–100)" value={product.competitionNow} onChange={value=>set('competitionNow',value)}/><Field label="Ad activity (0–100)" value={product.adsNow} onChange={value=>set('adsNow',value)}/></div>
   <div className="grid-3"><Field label="Reviews" value={product.reviewCount} onChange={value=>set('reviewCount',value)}/><Field label="Rating (0–5)" value={product.reviewRating} step="0.1" onChange={value=>set('reviewRating',value)}/><Field label="Trust (0–100)" value={product.trustSignals} onChange={value=>set('trustSignals',value)}/><Field label="Problem clarity" value={product.problemClarity} onChange={value=>set('problemClarity',value)}/><Field label="Visual appeal" value={product.visualAppeal} onChange={value=>set('visualAppeal',value)}/></div>
   <button className="primary" onClick={analyze} disabled={loading}>{loading?'Analyzing…':'Run SELL-AI Analysis →'}</button>
   {error&&<p className="error-message">{error}</p>}
   <p className="micro">DEMO / SIMULATED signals are clearly marked. External sources are never fabricated.</p>
   <div className="history"><div className="section-head compact"><div><span className="eyebrow">WORKSPACE MEMORY</span><h3>Saved analyses</h3></div>{history.length>0&&<button className="text-button" type="button" onClick={clearHistory}>Clear</button>}</div>{history.length===0?<p className="micro">Your completed analyses will appear here.</p>:<div className="history-list">{history.map(item=><button type="button" key={item.id} className={`history-item ${item.id===activeHistoryId?'active':''}`} onClick={()=>restore(item)}><span><strong>{item.productName}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></span><b className={`history-decision ${item.result.decision.label}`}>{item.result.decision.label.replace('-',' ')}</b></button>)}</div>}</div>
  </section>
  <section className="panel results-panel">
   <div className="section-head"><div><span className="eyebrow">EVIDENCE-FIRST OUTPUT</span><h2>Decision workspace</h2></div><span className="demo-badge">DEMO / SIMULATED</span></div>
   {!result?<div className="empty"><div><div className="empty-icon">✦</div><h3>Run an analysis</h3><p>SELL-AI will calculate profit, trend direction, buyer intent, risk, and evidence state.</p></div></div>:<>
    <DataStatusView status={result.dataStatus}/>
    <div className="decision"><div><span className="eyebrow">CURRENT ACTION</span><h3>{result.decision.label.replace('-',' ')}</h3><p>{result.decision.rationale[0]}</p></div><span className={`pill ${result.risk.level}`}>{result.risk.level} risk</span></div>
    <div className="metrics"><Metric label="Net profit / order" value={`Rs. ${result.profit.netProfit.toLocaleString()}`}/><Metric label="Margin" value={`${result.profit.marginPct}%`}/><Metric label="Buyer intent" value={`${result.buyerIntent.score}/100`}/><Metric label="Orders for Rs. 3,000/day" value={`${result.profit.ordersForDailyTarget}`}/></div>
    <div className="cards"><Card title="Trend acceleration"><strong>{result.trend.state}</strong><p>{result.trend.demandChangePct>=0?'+':''}{result.trend.demandChangePct}% demand change.</p><small>{result.trend.explanation}</small></Card><Card title="Buyer signals"><strong>{result.buyerIntent.score}/100</strong><p>{result.buyerIntent.drivers[0]}</p><small>{result.buyerIntent.frictions[0]}</small></Card><Card title="Risk flags"><strong>{result.risk.level}</strong><p>{result.risk.factors[0]}</p><small>Risk is based only on supplied inputs.</small></Card></div>
    <OpportunityView signals={result.opportunity.signals}/>
    <ProductDNAView dna={result.productDNA}/>
    <ResearchView research={result.research}/>
    <EvidenceLedger evidence={result.evidence}/>
   </>}
  </section>
 </div>;
}

function DataStatusView({status}:{status?:AnalysisResult['dataStatus']}){if(!status)return null;return <div className="data-status"><div className="section-head compact"><div><span className="eyebrow">REAL DATA STATUS</span><h3>Connection ledger</h3></div><span className="demo-badge">DEMO MODE</span></div><div className="status-grid"><Status label="Evidence" value={`${status.evidenceCount}`}/><Status label="Verified" value={`${status.verifiedEvidenceCount}`}/><Status label="Stale" value={`${status.staleEvidenceCount}`}/><Status label="Conflicts" value={`${status.conflictingEvidenceCount}`}/></div><p className="micro"><b>Connected:</b> {status.sourcesConnected.join(', ')} · <b>Unavailable:</b> {status.sourcesUnavailable.join(', ')} · <b>Last research:</b> {status.lastResearchTime?'available':'not connected'}</p></div>}
function OpportunityView({signals=[]}:{signals?:AnalysisResult['opportunity']['signals']}){if(!signals.length)return null;return <div className="insight-section"><div className="section-head compact"><div><span className="eyebrow">OPPORTUNITY RADAR</span><h3>Transparent signals</h3></div></div><div className="signal-grid">{signals.map(signal=><div className="signal" key={signal.key}><span>{signal.label}</span><strong>{signal.state}</strong><small>{signal.value} · {signal.status}</small></div>)}</div></div>}
function ProductDNAView({dna}:{dna?:AnalysisResult['productDNA']}){if(!dna)return null;return <div className="insight-section"><div className="section-head compact"><div><span className="eyebrow">PRODUCT DNA</span><h3>{dna.identity.name}</h3></div><span className="demo-badge">{dna.identity.mode}</span></div><div className="dna-grid"><Status label="Demand" value={`${dna.demand.current}/100`}/><Status label="Competition" value={dna.competition.value===null?'missing':`${dna.competition.value}/100`}/><Status label="Reviews" value={`${dna.reviews.count} · ${dna.reviews.rating}/5`}/><Status label="Seasonality" value={dna.seasonality.state}/></div><p className="micro">Use case: {dna.problem.useCase} Lifecycle: {dna.lifecycle.state}.</p></div>}
function ResearchView({research}: {research?:AnalysisResult['research']}){if(!research)return null;return <div className="insight-section"><div className="section-head compact"><div><span className="eyebrow">RESEARCH COST OPTIMIZER</span><h3>Research status</h3></div><span className="demo-badge">{research.status}</span></div><p className="micro">Queued request: {research.requests[0]?.missingEvidence.join(', ')}. No paid provider is enabled.</p><div className="provider-list">{research.providers.map(provider=><span key={provider.sourceName}>{provider.sourceName}: {provider.availability}</span>)}</div></div>}
function EvidenceLedger({evidence=[]}:{evidence?:AnalysisResult['evidence']}){return <div className="evidence"><div className="section-head compact"><div><span className="eyebrow">PROVENANCE</span><h3>Evidence ledger</h3></div><span className="micro">{evidence.length} records</span></div><div className="evidence-table-wrap"><table className="evidence-table"><thead><tr><th>Claim</th><th>Source / URL</th><th>Region</th><th>Values</th><th>Freshness</th><th>Status</th><th>Confidence</th></tr></thead><tbody>{evidence.map(item=><tr key={item.id}><td><strong>{item.claim}</strong><small>{item.sourceType}</small></td><td>{item.source}<small>{item.sourceUrl}</small></td><td>{item.region}</td><td><small>Original: {item.originalValue}</small><small>Normalized: {item.normalizedValue}</small></td><td>{item.freshness}<small>{item.freshnessHours}h</small></td><td><span className={`evidence-status ${item.verificationStatus}`}>{item.verificationStatus}</span></td><td>{Math.round(item.confidence*100)}%</td></tr>)}</tbody></table></div></div>}
function Field({label,value,step='1',onChange}:{label:string;value:number;step?:string;onChange:(value:string)=>void}){return <label>{label}<input type="number" step={step} value={value} onChange={event=>onChange(event.target.value)}/></label>}
function Metric({label,value}:{label:string;value:string}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}
function Status({label,value}:{label:string;value:string}){return <div className="status-card"><span>{label}</span><strong>{value}</strong></div>}
function Card({title,children}:{title:string;children:ReactNode}){return <div className="card"><span className="eyebrow">{title}</span>{children}</div>}
