'use client';
import {useEffect,useMemo,useState} from 'react';

type Row={key?:string;name?:string;value?:number;count?:number;total?:number;date?:string;[key:string]:unknown};
function rows(input:any):Row[]{
 if(!input) return [];
 if(Array.isArray(input)) return input;
 return input.data||input.rows||input.results||[];
}
function value(r:Row){return Number(r.value??r.count??r.total??r.pageviews??r.visitors??0)}
function label(r:Row){return String(r.key??r.name??r.date??r.requestPath??r.referrerHostname??r.deviceType??r.country??'')}
export function AdminAnalytics(){
 const [days,setDays]=useState(30);const [data,setData]=useState<any>(null);const [error,setError]=useState('');
 useEffect(()=>{setError('');fetch('/api/admin/analytics?days='+days,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load analytics');setData(d)}).catch(e=>setError(e.message))},[days]);
 const daily=rows(data?.byDay);const pages=rows(data?.byPage).sort((a,b)=>value(b)-value(a)).slice(0,10);const refs=rows(data?.byReferrer).sort((a,b)=>value(b)-value(a)).slice(0,8);const devices=rows(data?.byDevice).sort((a,b)=>value(b)-value(a));const countries=rows(data?.byCountry).sort((a,b)=>value(b)-value(a)).slice(0,8);
 const max=Math.max(1,...daily.map(value));const total=typeof data?.total==='number'?data.total:value(data?.total||{});
 if(!data&&!error)return <div className="admin-analytics"><p className="admin-muted">Loading analytics…</p></div>;
 if(data?.configured===false)return <div className="admin-analytics"><div className="admin-analytics-setup"><p className="eyebrow">SETUP REQUIRED</p><h2>Connect Vercel Web Analytics</h2><p>The site is ready to collect analytics, but the Vercel Analytics API token has not been connected to the admin yet. Web Analytics itself also needs to be enabled for the SMRE project in Vercel.</p><a className="admin-analytics-link" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Open Vercel Dashboard →</a></div></div>;
 if(error)return <div className="admin-analytics"><div className="admin-analytics-setup"><p className="eyebrow">ANALYTICS ERROR</p><h2>Couldn’t load analytics</h2><p>{error}</p></div></div>;
 return <div className="admin-analytics">
  <div className="admin-analytics-toolbar"><p className="admin-muted">Production website traffic. Data comes directly from Vercel Web Analytics.</p><select value={days} onChange={e=>setDays(Number(e.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div>
  <div className="admin-analytics-cards"><div className="admin-analytics-card"><span>Page views</span><strong>{total.toLocaleString()}</strong></div><div className="admin-analytics-card"><span>Top page</span><strong>{pages[0]?label(pages[0]):'—'}</strong></div><div className="admin-analytics-card"><span>Days tracked</span><strong>{days}</strong></div></div>
  <div className="admin-analytics-panel"><div className="admin-analytics-panel-head"><div><p className="eyebrow">TRAFFIC</p><h2>Page views by day</h2></div></div><div className="admin-analytics-bars">{daily.map((r,i)=><div key={i} className="admin-analytics-bar" style={{height:(value(r)/max*100)+'%'}}><span>{String(r.date??r.key??'').slice(5,10)}</span></div>)}</div></div>
  <div className="admin-analytics-grid"><div className="admin-analytics-panel"><div className="admin-analytics-panel-head"><div><p className="eyebrow">CONTENT</p><h2>Top pages</h2></div></div><div className="admin-analytics-list">{pages.map((r,i)=><div key={i}><div className="admin-analytics-row"><span>{label(r)}</span><span className="admin-analytics-value">{value(r).toLocaleString()}</span></div><div className="admin-analytics-meter"><i style={{width:(value(r)/Math.max(1,value(pages[0]))*100)+'%'}}/></div></div>)}</div></div>
  <div className="admin-analytics-panel"><div className="admin-analytics-panel-head"><div><p className="eyebrow">SOURCES</p><h2>Referrers</h2></div></div><div className="admin-analytics-list">{refs.length?refs.map((r,i)=><div key={i} className="admin-analytics-row"><span>{label(r)||'Direct'}</span><span className="admin-analytics-value">{value(r).toLocaleString()}</span></div>):<p className="admin-muted">No referrer data yet.</p>}</div></div></div>
  <div className="admin-analytics-grid"><div className="admin-analytics-panel"><div className="admin-analytics-panel-head"><div><p className="eyebrow">DEVICES</p><h2>Devices</h2></div></div><div className="admin-analytics-list">{devices.map((r,i)=><div key={i} className="admin-analytics-row"><span>{label(r)}</span><span className="admin-analytics-value">{value(r).toLocaleString()}</span></div>)}</div></div><div className="admin-analytics-panel"><div className="admin-analytics-panel-head"><div><p className="eyebrow">LOCATION</p><h2>Top countries</h2></div></div><div className="admin-analytics-list">{countries.map((r,i)=><div key={i} className="admin-analytics-row"><span>{label(r)}</span><span className="admin-analytics-value">{value(r).toLocaleString()}</span></div>)}</div></div></div>
 </div>;
}
