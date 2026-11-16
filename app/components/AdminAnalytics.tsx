'use client';
import {useEffect,useState} from 'react';
type Row={key?:string;name?:string;value?:number;count?:number;total?:number;pageviews?:number;visitors?:number;timestamp?:string|number;date?:string;requestPath?:string;referrerHostname?:string;deviceType?:string;country?:string;[key:string]:unknown};
type Lead={type:string;createdAt:string;status?:string};
function rows(input:any):Row[]{if(!input)return [];const v=input.data??input.rows??input.results??input;if(Array.isArray(v))return v;if(v&&typeof v==='object')return Object.entries(v).map(([key,x])=>typeof x==='number'?{key,value:x}:{key,...(x as object)});return []}
function metric(input:any,key:string):number{const v=input?.data?.[key]??input?.[key]??input?.data?.[0]?.[key]??input?.[0]?.[key];return Number(v??0)||0}
function count(r:Row):number{return Number(r.pageviews??r.value??r.count??r.total??r.visitors??0)||0}
function label(r:Row):string{return String(r.key??r.name??r.requestPath??r.referrerHostname??r.deviceType??r.country??'')}
function dateLabel(r:Row):string{const raw=r.timestamp??r.date??r.key;if(raw===undefined||raw===null)return '';const d=typeof raw==='number'?new Date(raw):new Date(String(raw));return Number.isNaN(d.getTime())?String(raw):d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function Panel({eyebrow,title,children}:{eyebrow:string;title:string;children:any}){return <section className="admin-analytics-panel"><div className="admin-analytics-panel-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{children}</section>}
function Ranking({items}:{items:Row[]}){const max=Math.max(1,...items.map(count));return <div className="admin-analytics-list">{items.length?items.map((r,i)=><div key={i}><div className="admin-analytics-row"><span title={label(r)}>{label(r)||'Direct'}</span><strong className="admin-analytics-value">{count(r).toLocaleString()}</strong></div><div className="admin-analytics-meter"><i style={{width:(count(r)/max*100)+'%'}}/></div></div>):<p className="admin-muted">No data in this period.</p>}</div>}
export function AdminAnalytics({leads=[]}:{leads?:Lead[]}){
 const [days,setDays]=useState(30);const [data,setData]=useState<any>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [reload,setReload]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');fetch('/api/admin/analytics?days='+days,{cache:'no-store'}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.detail||x.error||'Unable to load analytics');if(active)setData(x)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[days,reload]);
 const daily=rows(data?.byDay).filter(r=>r.timestamp!==undefined||r.date!==undefined);
 const allPages=rows(data?.byPage).sort((x,y)=>count(y)-count(x));const pages=allPages.slice(0,10);
 const refs=rows(data?.byReferrer).sort((x,y)=>count(y)-count(x)).slice(0,8);
 const devices=rows(data?.byDevice).sort((x,y)=>count(y)-count(x));
 const countries=rows(data?.byCountry).sort((x,y)=>count(y)-count(x)).slice(0,8);
 const pageViews=metric(data?.total,'pageviews')||allPages.reduce((sum,r)=>sum+count(r),0);
 const visitors=metric(data?.total,'visitors');
 const maxDaily=Math.max(1,...daily.map(count));const maxPage=Math.max(1,...pages.map(count));
 const showing=leads.filter(x=>/showing/i.test(x.type)).length;
 const buyer=leads.filter(x=>/buyer/i.test(x.type)).length;const seller=leads.filter(x=>/seller/i.test(x.type)).length;
 const periodLeads=leads.filter(x=>{const t=new Date(x.createdAt).getTime();return Number.isFinite(t)&&t>=Date.now()-days*86400000}).length;
 if(loading&&!data)return <div className="admin-analytics"><p className="admin-muted">Loading website analytics…</p></div>;
 if(data?.configured===false)return <div className="admin-analytics"><div className="admin-analytics-setup"><p className="eyebrow">SETUP REQUIRED</p><h2>Connect Vercel Web Analytics</h2><p>The site is ready to collect analytics, but the Vercel Analytics API token is not available to this deployment.</p><a className="admin-analytics-link" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Open Vercel Dashboard →</a></div></div>;
 if(error)return <div className="admin-analytics"><div className="admin-analytics-setup"><p className="eyebrow">ANALYTICS ERROR</p><h2>Couldn’t load analytics</h2><p>{error}</p><button className="button button-dark" onClick={()=>setReload(x=>x+1)}>Try again</button></div></div>;
 return <div className="admin-analytics">
  <div className="admin-analytics-toolbar"><div><p className="admin-muted">Website activity and lead activity for the selected period.</p><p className="admin-analytics-updated">Traffic from Vercel Web Analytics · Inquiries from SMRE forms</p></div><select aria-label="Analytics date range" value={days} onChange={e=>setDays(Number(e.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div>
  <div className="admin-analytics-section-title"><div><p className="eyebrow">WEBSITE TRAFFIC</p><h2>Traffic overview</h2></div><span>Last {days} days</span></div>
  <div className="admin-analytics-cards">
   <article className="admin-analytics-card"><span>Page views</span><strong>{pageViews.toLocaleString()}</strong><small>Total pages viewed</small></article>
   <article className="admin-analytics-card"><span>Unique visitors</span><strong>{visitors?visitors.toLocaleString():'—'}</strong><small>{visitors?'Privacy-friendly visitor count':'Not returned by the API'}</small></article>
   <article className="admin-analytics-card"><span>Website leads</span><strong>{periodLeads.toLocaleString()}</strong><small>Inquiries recorded in this period</small></article>
   <article className="admin-analytics-card"><span>Showing requests</span><strong>{showing.toLocaleString()}</strong><small>All recorded showing requests</small></article>
  </div>
  <div className="admin-analytics-section-title"><div><p className="eyebrow">VISITOR ACTIVITY</p><h2>What visitors are doing</h2></div></div>
  <Panel eyebrow="TRAFFIC TREND" title="Page views over time">{daily.length?<div className="admin-analytics-chart"><div className="admin-analytics-y-labels"><span>{maxDaily.toLocaleString()}</span><span>{Math.round(maxDaily/2).toLocaleString()}</span><span>0</span></div><div className="admin-analytics-chart-area"><div className="admin-analytics-gridlines"><i/><i/><i/></div><div className="admin-analytics-bars">{daily.map((r,i)=><div key={i} className="admin-analytics-bar-wrap" title={dateLabel(r)+': '+count(r).toLocaleString()+' page views'}><div className="admin-analytics-bar" style={{height:Math.max(2,count(r)/maxDaily*100)+'%'}}/><span>{dateLabel(r)}</span></div>)}</div></div></div>:<p className="admin-muted">Daily breakdown is not available for this range yet.</p>}</Panel>
  <div className="admin-analytics-grid"><Panel eyebrow="PROPERTY INTEREST" title="Most-viewed pages"><div className="admin-analytics-list">{pages.length?pages.map((r,i)=><div key={i}><div className="admin-analytics-row"><span title={label(r)}>{label(r)||'/'}</span><strong className="admin-analytics-value">{count(r).toLocaleString()}</strong></div><div className="admin-analytics-meter"><i style={{width:(count(r)/maxPage*100)+'%'}}/></div></div>):<p className="admin-muted">No page data available.</p>}</div></Panel><Panel eyebrow="TRAFFIC SOURCES" title="Where visitors came from"><Ranking items={refs}/></Panel></div>
  <div className="admin-analytics-section-title"><div><p className="eyebrow">AUDIENCE</p><h2>Visitor profile</h2></div></div>
  <div className="admin-analytics-grid"><Panel eyebrow="DEVICE BREAKDOWN" title="Devices"><Ranking items={devices}/></Panel><Panel eyebrow="GEOGRAPHY" title="Visitor locations"><Ranking items={countries}/></Panel></div>
  <div className="admin-analytics-section-title"><div><p className="eyebrow">LEAD ACTIVITY</p><h2>Inquiries generated</h2></div></div>
  <div className="admin-analytics-cards admin-analytics-lead-cards"><article className="admin-analytics-card"><span>All recorded leads</span><strong>{leads.length.toLocaleString()}</strong><small>Stored in the SMRE admin</small></article><article className="admin-analytics-card"><span>Buyer inquiries</span><strong>{buyer.toLocaleString()}</strong><small>Identified by inquiry type</small></article><article className="admin-analytics-card"><span>Seller inquiries</span><strong>{seller.toLocaleString()}</strong><small>Identified by inquiry type</small></article></div>
  <p className="admin-analytics-footnote">Traffic and inquiry records are separate measurements. A lead is counted when a form submission is recorded, not simply when someone views a listing.</p>
 </div>;
}
