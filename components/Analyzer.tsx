"use client";

import {useEffect,useState} from 'react';
import {demoProduct} from '../data/demo';
import {AnalysisRecord,AnalysisResult,ProductInput} from '../lib/types';

const HISTORY_KEY='sell-ai:analysis-history';
const MAX_HISTORY=8;

function readHistory():AnalysisRecord[]{
 if(typeof window==='undefined')return[];
 try{
  const value=JSON.parse(window.localStorage.getItem(HISTORY_KEY)||'[]');
  return Array.isArray(value)?value:[];
 }catch{return[]}
}

function writeHistory(value:AnalysisRecord[]){
 if(typeof window==='undefined')return;
 try{window.localStorage.setItem(HISTORY_KEY,JSON.stringify(value));}catch{/* Storage is optional. */}
}

export default function Analyzer(){
 const[product,setProduct]=useState<ProductInput>(demoProduct);
 const[result,setResult]=useState<AnalysisResult|null>(null);
 const[history,setHistory]=useState<AnalysisRecord[]>([]);
 const[activeHistoryId,setActiveHistoryId]=useState<string|null>(null);
 const[loading,setLoading]=useState(false);
 const[error,setError]=useState('');

 useEffect(()=>setHistory(readHistory()),[]);

 const set=(key:keyof ProductInput,value:string)=>setProduct(p=>({...p,[key]:key==='name'?value:Number(value)}));

 const saveRecord=(next:AnalysisRecord)=>setHistory(current=>{
  const updated=[next,...current.filter(item=>item.id!==next.id)].slice(0,MAX_HISTORY);
  writeHistory(updated);
  return updated;
 });

 async function analyze(){
  setLoading(true);
  setError('');
  try{
   const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(product)});
   const json=await res.json();
   if(!res.ok||!json.ok){setError(json.error||'Analysis failed.');return;}
   const nextResult=json.result as AnalysisResult;
   const record:AnalysisRecord={
    id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}`,
    createdAt:new Date().toISOString(),
    productName:product.name.trim()||'Untitled product',
    input:product,
    result:nextResult,
   };
   setResult(nextResult);
   setActiveHistoryId(record.id);
   saveRecord(record);
  }catch{setError('Could not reach the analysis engine.');}
  finally{setLoading(false);}
 }

 function restore(record:AnalysisRecord){
  setProduct(record.input);
  setResult(record.result);
  setActiveHistoryId(record.id);
  setError('');
 }

 function clearHistory(){
  setHistory([]);
  setActiveHistoryId(null);
  writeHistory([]);
 }

 return <div className="workspace">
  <section className="panel input-panel">
   <div className="section-head"><div><span className="eyebrow">PRODUCT INTELLIGENCE</span><h2>Analyze a product</h2></div><span className="status-dot">● live engine</span></div>
   <label>Product name<input value={product.name} onChange={e=>set('name',e.target.value)}/></label>
   <div className="grid-2">
    <Field label="Selling price" value={product.sellingPrice} onChange={v=>set('sellingPrice',v)}/><Field label="Product cost" value={product.productCost} onChange={v=>set('productCost',v)}/>
    <Field label="Shipping" value={product.shipping} onChange={v=>set('shipping',v)}/><Field label="Packaging" value={product.packaging} onChange={v=>set('packaging',v)}/>
    <Field label="Platform fee" value={product.platformFee} onChange={v=>set('platformFee',v)}/><Field label="Payment fee" value={product.paymentFee} onChange={v=>set('paymentFee',v)}/>
    <Field label="Ad cost / order" value={product.adCost} onChange={v=>set('adCost',v)}/><Field label="Return cost / order" value={product.returnCost} onChange={v=>set('returnCost',v)}/>
    <Field label="Demand now (0–100)" value={product.demandNow} onChange={v=>set('demandNow',v)}/><Field label="Demand previous (0–100)" value={product.demandPrevious} onChange={v=>set('demandPrevious',v)}/>
    <Field label="Competition (0–100)" value={product.competitionNow} onChange={v=>set('competitionNow',v)}/><Field label="Ad activity (0–100)" value={product.adsNow} onChange={v=>set('adsNow',v)}/>
   </div>
   <div className="grid-3">
    <Field label="Reviews" value={product.reviewCount} onChange={v=>set('reviewCount',v)}/><Field label="Rating (0–5)" value={product.reviewRating} step="0.1" onChange={v=>set('reviewRating',v)}/><Field label="Trust (0–100)" value={product.trustSignals} onChange={v=>set('trustSignals',v)}/>
    <Field label="Problem clarity" value={product.problemClarity} onChange={v=>set('problemClarity',v)}/><Field label="Visual appeal" value={product.visualAppeal} onChange={v=>set('visualAppeal',v)}/>
   </div>
   <button className="primary" onClick={analyze} disabled={loading}>{loading?'Analyzing…':'Run SELL-AI Analysis →'}</button>
   {error&&<p className="error-message">{error}</p>}
   <p className="micro">Day 2 saves the latest analyses in this browser. External sources are not fabricated.</p>
   <div className="history">
    <div className="section-head compact"><div><span className="eyebrow">WORKSPACE MEMORY</span><h3>Saved analyses</h3></div>{history.length>0&&<button className="text-button" type="button" onClick={clearHistory}>Clear</button>}</div>
    {history.length===0?<p className="micro">Your completed analyses will appear here.</p>:<div className="history-list">{history.map(item=><button type="button" key={item.id} className={`history-item ${item.id===activeHistoryId?'active':''}`} onClick={()=>restore(item)}><span><strong>{item.productName}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></span><b className={`history-decision ${item.result.decision.label}`}>{item.result.decision.label.replace('-',' ')}</b></button>)}</div>}
   </div>
  </section>
  <section className="panel results-panel">
   <div className="section-head"><div><span className="eyebrow">EVIDENCE-FIRST OUTPUT</span><h2>Decision workspace</h2></div></div>
   {!result?<div className="empty"><div><div className="empty-icon">✦</div><h3>Run an analysis</h3><p>SELL-AI will calculate profit, trend direction, buyer intent, risk, and evidence state.</p></div></div>:<>
    <div className="decision"><div><span className="eyebrow">CURRENT ACTION</span><h3>{result.decision.label.replace('-',' ')}</h3><p>{result.decision.rationale[0]}</p></div><span className={`pill ${result.risk.level}`}>{result.risk.level} risk</span></div>
    <div className="metrics"><Metric label="Net profit / order" value={`Rs. ${result.profit.netProfit.toLocaleString()}`}/><Metric label="Margin" value={`${result.profit.marginPct}%`}/><Metric label="Buyer intent" value={`${result.buyerIntent.score}/100`}/><Metric label="Orders for Rs. 3,000/day" value={`${result.profit.ordersForDailyTarget}`}/></div>
    <div className="cards"><Card title="Trend acceleration"><strong>{result.trend.state}</strong><p>{result.trend.demandChangePct>=0?'+':''}{result.trend.demandChangePct}% demand change.</p><small>{result.trend.explanation}</small></Card><Card title="Buyer signals"><strong>{result.buyerIntent.score}/100</strong><p>{result.buyerIntent.drivers[0]}</p><small>{result.buyerIntent.frictions[0]}</small></Card><Card title="Risk flags"><strong>{result.risk.level}</strong><p>{result.risk.factors[0]}</p><small>Risk is based only on supplied inputs.</small></Card></div>
    <div className="evidence"><div className="section-head compact"><div><span className="eyebrow">PROVENANCE</span><h3>Evidence ledger</h3></div></div>{result.evidence.map(e=><div className="evidence-row" key={e.id}><div><strong>{e.claim}</strong><p>{e.source} · {new Date(e.timestamp).toLocaleString()}</p></div><span className={`evidence-status ${e.status}`}>{e.status}</span></div>)}</div>
   </>}
  </section>
 </div>;
}

function Field({label,value,step='1',onChange}:{label:string;value:number;step?:string;onChange:(v:string)=>void}){return <label>{label}<input type="number" step={step} value={value} onChange={e=>onChange(e.target.value)}/></label>}
function Metric({label,value}:{label:string;value:string}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}
function Card({title,children}:{title:string;children:React.ReactNode}){return <div className="card"><span className="eyebrow">{title}</span>{children}</div>}
