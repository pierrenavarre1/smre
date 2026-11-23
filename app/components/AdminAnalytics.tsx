'use client';
import {useEffect,useState} from 'react';
type Row={key?:string;name?:string;value?:number;count?:number;total?:number;pageviews?:number;visitors?:number;timestamp?:string|number;date?:string;requestPath?:string;referrerHostname?:string;deviceType?:string;country?:string;browserName?:string;osName?:string;eventName?:string;eventData?:string;[key:string]:unknown};
type Lead={type:string;createdAt:string;status?:string};
type SearchRow={keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number};
function rows(input:any):Row[]{if(!input)return [];const v=input.data??input.rows??input.results??input;if(Array.isArray(v))return v;if(v&&typeof v==='object')return Object.entries(v).map(([key,x])=>typeof x==='number'?{key,value:x}:{key,...(x as object)});return []}
function metric(input:any,key:string):number{const v=input?.data?.[key]??input?.[key]??input?.data?.[0]?.[key]??input?.[0]?.[key];return Number(v??0)||0}
function count(r:Row):number{return Number(r.pageviews??r.value??r.count??r.total??r.visitors??0)||0}
function label(r:Row):string{
 // Vercel's Events Aggregate API returns eventName and eventData fields,
 // not the generic key/keys shape used by older analytics endpoints.
 if(typeof r.eventData==='string'){
  try{
   const parsed=JSON.parse(r.eventData);
   if(parsed&&typeof parsed==='object'){
    const values=Object.entries(parsed as Record<string,unknown>)
     .filter(([,v])=>v!==null&&v!==undefined&&String(v).trim()!=='')
     .map(([k,v])=>`${k}: ${String(v)}`);
    if(values.length)return values.join(' · ');
   }
  }catch{}
 }
 if(typeof r.eventName==='string'&&r.eventName.trim())return r.eventName;
 const keys=Array.isArray(r.keys)?r.keys.filter(v=>v!==null&&v!==undefined&&String(v).trim()!==''):[];
 const raw=keys.length?keys:r.key??r.name??r.requestPath??r.referrerHostname??r.deviceType??r.country??r.browserName??r.osName;
 if(Array.isArray(raw))return raw.map(v=>typeof v==='object'&&v!==null?Object.values(v as Record<string,unknown>).filter(x=>x!==null&&x!==undefined).join(' '):String(v)).filter(Boolean).join(' · ');
 if(raw&&typeof raw==='object')return Object.values(raw as Record<string,unknown>).filter(v=>v!==null&&v!==undefined&&String(v).trim()!=='').map(String).join(' · ');
 return raw===undefined||raw===null?'':String(raw);
}
function dateLabel(r:Row):string{const raw=r.timestamp??r.date??r.key;if(raw===undefined||raw===null)return '';const d=typeof raw==='number'?new Date(raw):new Date(String(raw));return Number.isNaN(d.getTime())?String(raw):d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function Panel({eyebrow,title,children}:{eyebrow:string;title:string;children:any}){return <section className="admin-analytics-panel"><div className="admin-analytics-panel-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{children}</section>}
function Ranking({items}:{items:Row[]}){const max=Math.max(1,...items.map(count));return <div className="admin-analytics-list">{items.length?items.map((r,i)=><div key={i}><div className="admin-analytics-row"><span title={label(r)}>{label(r)||'Unspecified / unavailable'}</span><strong className="admin-analytics-value">{count(r).toLocaleString()}</strong></div><div className="admin-analytics-meter"><i style={{width:(count(r)/max*100)+'%'}}/></div></div>):<p className="admin-muted">No data in this period.</p>}</div>}
function SearchTable({items}:{items:SearchRow[]}){return items.length?<div className="admin-analytics-table-wrap"><table className="admin-analytics-table"><thead><tr><th>Search phrase / page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg. position</th></tr></thead><tbody>{items.slice(0,12).map((r,i)=><tr key={i}><td title={r.keys?.[0]}>{r.keys?.[0]||'—'}</td><td>{Number(r.clicks||0).toLocaleString()}</td><td>{Number(r.impressions||0).toLocaleString()}</td><td>{(Number(r.ctr||0)*100).toFixed(1)}%</td><td>{Number(r.position||0).toFixed(1)}</td></tr>)}</tbody></table></div>:<p className="admin-muted">No Search Console data returned for this period.</p>}
export function AdminAnalytics({leads=[]}:{leads?:Lead[]}){
 const [days,setDays]=useState(30);const [data,setData]=useState<any>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [reload,setReload]=useState(0);
 const [search,setSearch]=useState<any>(null);const [searchError,setSearchError]=useState('');const [searchLoading,setSearchLoading]=useState(true);
 useEffect(()=>{let active=true;setLoading(true);setError('');fetch('/api/admin/analytics?days='+days,{cache:'no-store'}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.detail||x.error||'Unable to load analytics');if(active)setData(x)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[days,reload]);
 useEffect(()=>{let active=true;setSearchLoading(true);setSearchError('');fetch('/api/admin/search-console?days='+days,{cache:'no-store'}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.detail||x.error||'Unable to load Search Console');if(active)setSearch(x)}).catch(e=>{if(active)setSearchError(e.message)}).finally(()=>{if(active)setSearchLoading(false)});return()=>{active=false}},[days,reload]);
 const daily=rows(data?.byDay).filter(r=>r.timestamp!==undefined||r.date!==undefined);
 const allPages=rows(data?.byPage).sort((x,y)=>count(y)-count(x));const pages=allPages.slice(0,10);
 const refs=rows(data?.byReferrer).sort((x,y)=>count(y)-count(x)).slice(0,8);
 const devices=rows(data?.byDevice).sort((x,y)=>count(y)-count(x));
 const countries=rows(data?.byCountry).sort((x,y)=>count(y)-count(x)).slice(0,10);
 const browsers=rows(data?.byBrowser).sort((x,y)=>count(y)-count(x));
 const systems=rows(data?.byOs).sort((x,y)=>count(y)-count(x));
 const events=rows(data?.byEvents).sort((x,y)=>count(y)-count(x));
 const listingViews=rows(data?.byListingViews).sort((x,y)=>count(y)-count(x)).slice(0,12);
 const propertySearches=rows(data?.byPropertySearches).sort((x,y)=>count(y)-count(x));
 const leadEvents=rows(data?.byLeadEvents).sort((x,y)=>count(y)-count(x));
 const pageViews=metric(data?.total,'pageviews')||allPages.reduce((sum,r)=>sum+count(r),0);
 const visitors=metric(data?.total,'visitors');
 const maxDaily=Math.max(1,...daily.map(count));
 const showing=leads.filter(x=>/showing/i.test(x.type)).length;
 const buyer=leads.filter(x=>/buyer/i.test(x.type)).length;const seller=leads.filter(x=>/seller/i.test(x.type)).length;
 const periodLeads=leads.filter(x=>{const t=new Date(x.createdAt).getTime();return Number.isFinite(t)&&t>=Date.now()-days*86400000}).length;
 if(loading&&!data)return <div className="admin-analytics"><p className="admin-muted">Loading website analytics…</p></div>;
 if(data?.configured===false)return <div className="admin-analytics"><div className="admin-analytics-setup"><p className="eyebrow">SETUP REQUIRED</p><h2>Connect Vercel Web Analytics</h2><p>The site is ready to collect analytics, but the Vercel Analytics API token is not available to this deployment.</p><a className="admin-analytics-link" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Open Vercel Dashboard →</a></div></div>;
 if(error)return <div className="admin-analytics"><div className="admin-analytics-setup"><p className="eyebrow">ANALYTICS ERROR</p><h2>Couldn’t load analytics</h2><p>{error}</p><button className="button button-dark" onClick={()=>setReload(x=>x+1)}>Try again</button></div></div>;
 return <div className="admin-analytics">
  <div className="admin-analytics-toolbar"><div><p className="admin-muted">Website audience, property interest, search visibility and inquiry activity.</p><p className="admin-analytics-updated">Privacy-friendly aggregate data · Last refreshed when this page loaded</p></div><div className="admin-analytics-controls"><select aria-label="Analytics date range" value={days} onChange={e=>setDays(Number(e.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><button className="button button-light" onClick={()=>setReload(x=>x+1)}>Refresh</button></div></div>
  <div className="admin-analytics-section-title"><div><p className="eyebrow">WEBSITE TRAFFIC</p><h2>Traffic overview</h2></div><span>Last {days} days</span></div>
  <div className="admin-analytics-cards">
   <article className="admin-analytics-card"><span>Page views</span><strong>{pageViews.toLocaleString()}</strong><small>Total pages viewed</small></article>
   <article className="admin-analytics-card"><span>Unique visitors</span><strong>{visitors?visitors.toLocaleString():'—'}</strong><small>{visitors?'Privacy-friendly visitor count':'Not returned by the API'}</small></article>
   <article className="admin-analytics-card"><span>Website leads</span><strong>{periodLeads.toLocaleString()}</strong><small>Inquiries recorded in this period</small></article>
   <article className="admin-analytics-card"><span>Showing requests</span><strong>{showing.toLocaleString()}</strong><small>All recorded showing requests</small></article>
  </div>
  <div className="admin-analytics-section-title"><div><p className="eyebrow">VISITOR ACTIVITY</p><h2>What visitors are doing</h2></div></div>
  <Panel eyebrow="TRAFFIC TREND" title="Page views over time">{daily.length?<div className="admin-analytics-chart"><div className="admin-analytics-y-labels"><span>{maxDaily.toLocaleString()}</span><span>{Math.round(maxDaily/2).toLocaleString()}</span><span>0</span></div><div className="admin-analytics-chart-area"><div className="admin-analytics-gridlines"><i/><i/><i/></div><div className="admin-analytics-bars">{daily.map((r,i)=><div key={i} className="admin-analytics-bar-wrap" tabIndex={0} role="img" aria-label={dateLabel(r)+': '+count(r).toLocaleString()+' page views'} data-tooltip={dateLabel(r)+' · '+count(r).toLocaleString()+' page views'}><div className="admin-analytics-bar" style={{height:Math.max(2,count(r)/maxDaily*100)+'%'}}/></div>)}</div></div></div>:<p className="admin-muted">Daily breakdown is not available for this range yet.</p>}</Panel>
  <div className="admin-analytics-grid"><Panel eyebrow="TRAFFIC SOURCES" title="Where visitors came from"><Ranking items={refs}/></Panel><Panel eyebrow="GEOGRAPHY" title="Visitor countries"><Ranking items={countries}/></Panel></div>
  <div className="admin-analytics-grid"><Panel eyebrow="DEVICE BREAKDOWN" title="Devices"><Ranking items={devices}/></Panel><Panel eyebrow="BROWSER BREAKDOWN" title="Browsers"><Ranking items={browsers}/></Panel></div>
  <div className="admin-analytics-grid"><Panel eyebrow="OPERATING SYSTEM" title="Visitor operating systems"><Ranking items={systems}/></Panel><Panel eyebrow="PROPERTY INTEREST" title="Most-viewed pages"><Ranking items={pages}/></Panel></div>
  <div className="admin-analytics-section-title"><div><p className="eyebrow">GOOGLE SEARCH</p><h2>How people find SMRE</h2></div></div>
  {searchLoading?<p className="admin-muted">Loading Google Search Console…</p>:search?.configured===false?<div className="admin-analytics-setup"><h2>Google Search Console connection needed</h2><p>Once connected, this section will show the actual Google phrases people searched, clicks, impressions, click-through rate and average search position. The connection needs a Google service account with read-only Search Console access, plus the three environment variables listed in the setup notes.</p><p className="admin-analytics-small">Required: GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY and GSC_SITE_URL. Add the service account as a user for the SMRE property in Search Console.</p><a className="admin-analytics-link" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Open Google Search Console →</a></div>:searchError?<div className="admin-analytics-setup"><p>{searchError}</p></div>:<><div className="admin-analytics-grid"><Panel eyebrow="SEARCH QUERIES" title="What people typed into Google"><SearchTable items={search?.queries||[]}/></Panel><Panel eyebrow="LANDING PAGES" title="Pages appearing in Google"><SearchTable items={search?.pages||[]}/></Panel></div><div className="admin-analytics-grid"><Panel eyebrow="SEARCH COUNTRIES" title="Google search audience"><SearchTable items={search?.countries||[]}/></Panel><Panel eyebrow="SEARCH DEVICES" title="Search device breakdown"><SearchTable items={search?.devices||[]}/></Panel></div><p className="admin-analytics-footnote">Search Console data is delayed by a few days. Average position is a search-result average, not a fixed ranking.</p></>}
  <div className="admin-analytics-section-title"><div><p className="eyebrow">REAL ESTATE INTEREST</p><h2>What buyers are looking at</h2></div></div>
  {data?.customEventsAvailable?<><div className="admin-analytics-grid"><Panel eyebrow="PROPERTY VIEWS" title="Most-viewed listings"><Ranking items={listingViews}/></Panel><Panel eyebrow="PROPERTY SEARCHES" title="Search methods and property types"><Ranking items={propertySearches}/></Panel></div><div className="admin-analytics-grid"><Panel eyebrow="INTERACTION SUMMARY" title="Tracked actions"><Ranking items={events}/></Panel><Panel eyebrow="INQUIRIES" title="Lead submissions by type"><Ranking items={leadEvents}/></Panel></div></>:<div className="admin-analytics-setup"><h2>Custom event reporting is not available yet</h2><p>Listing views, property search filters and successful inquiries are now instrumented in the website code. Vercel only stores and reports custom events on Pro and Enterprise plans. This dashboard will display the breakdown when custom event reporting is available. No plan upgrade has been made.</p></div>}
  <div className="admin-analytics-section-title"><div><p className="eyebrow">LEAD ACTIVITY</p><h2>Inquiries generated</h2></div></div>
  <div className="admin-analytics-cards admin-analytics-lead-cards"><article className="admin-analytics-card"><span>All recorded leads</span><strong>{leads.length.toLocaleString()}</strong><small>Stored in the SMRE admin</small></article><article className="admin-analytics-card"><span>Buyer inquiries</span><strong>{buyer.toLocaleString()}</strong><small>Identified by inquiry type</small></article><article className="admin-analytics-card"><span>Seller inquiries</span><strong>{seller.toLocaleString()}</strong><small>Identified by inquiry type</small></article></div>
  <p className="admin-analytics-footnote">Vercel provides anonymized country-level geography, not city or state in the current API. It does not identify individual visitors. Search Console shows organic Google search activity, not every source that sends a visitor. Lead totals come from SMRE form submissions.</p>
 </div>;
}
