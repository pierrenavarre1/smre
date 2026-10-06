'use client';
import {useEffect,useState} from 'react';

type Data={settings:any;agents:any[];guides:any[];leads:any[]};

export function AdminDashboard(){
 const [data,setData]=useState<Data|null>(null); const [section,setSection]=useState('dashboard'); const [message,setMessage]=useState('');
 useEffect(()=>{fetch('/api/admin/data',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(setData).catch(()=>setMessage('Unable to load admin data.'));},[]);
 async function save(next:Data){setData(next);setMessage('Saving…');const r=await fetch('/api/admin/data',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(next)});setMessage(r.ok?'Saved.':'Save failed.');}
 if(!data)return <main className="admin-shell"><div className="admin-loading">{message||'Loading…'}</div></main>;
 const updateLead=(id:string,status:string)=>save({...data,leads:data.leads.map(l=>l.id===id?{...l,status}:l)});
 const updateAgent=(i:number,key:string,value:string)=>save({...data,agents:data.agents.map((a,n)=>n===i?{...a,[key]:value}:a)});
 return <main className="admin-shell"><div className="admin-layout">
  <aside className="admin-nav"><div><p className="eyebrow">SMRE ADMIN</p><h2>Website</h2></div>{[['dashboard','Dashboard'],['leads','Leads'],['agents','Agents'],['guides','Guides'],['settings','Settings']].map(([id,label])=><button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}>{label}</button>)}<button onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});location.href='/admin/login'}}>Sign out</button></aside>
  <section className="admin-main"><div className="admin-top"><div><p className="eyebrow">ST. MARY’S REAL ESTATE</p><h1>{section==='dashboard'?'Dashboard':section[0].toUpperCase()+section.slice(1)}</h1></div><span className="admin-save">{message}</span></div>
  {section==='dashboard'&&<div className="admin-cards"><div><strong>{data.leads.filter(l=>l.status==='new').length}</strong><span>New leads</span></div><div><strong>{data.leads.filter(l=>l.type==='Showing Request').length}</strong><span>Showing requests</span></div><div><strong>{data.agents.length}</strong><span>Agents</span></div><div><strong>{data.guides.length}</strong><span>Guides</span></div></div>}
  {section==='leads'&&<div className="admin-list">{data.leads.length?<table><thead><tr><th>Date</th><th>Lead</th><th>Type</th><th>Property</th><th>Status</th></tr></thead><tbody>{data.leads.map(l=><tr key={l.id}><td>{new Date(l.createdAt).toLocaleString()}</td><td><strong>{l.name}</strong><br/>{l.email||l.phone}</td><td>{l.type}</td><td>{l.address||'—'}{l.listingId&&<small>MLS {l.listingId}</small>}</td><td><select value={l.status} onChange={e=>updateLead(l.id,e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table>:<p>No leads yet.</p>}</div>}
  {section==='agents'&&<div className="admin-edit-grid">{data.agents.map((a,i)=><article key={a.slug}><p className="eyebrow">{a.role}</p><h2>{a.name}</h2><label>Phone<input value={a.phone} onChange={e=>updateAgent(i,'phone',e.target.value)}/></label><label>Bio<textarea rows={7} value={a.bio} onChange={e=>updateAgent(i,'bio',e.target.value)}/></label><label>Market<input value={a.market} onChange={e=>updateAgent(i,'market',e.target.value)}/></label></article>)}</div>}
  {section==='guides'&&<div className="admin-list"><p><strong>{data.guides.length} guides</strong> are currently in the site content store. Full guide editing is the next content-editor layer; the underlying data is now separated from the page code.</p>{data.guides.map(g=><article className="admin-guide-row" key={g.slug}><strong>{g.title}</strong><span>{g.category}</span></article>)}</div>}
  {section==='settings'&&<Settings data={data} save={save}/>}
  </section></div></main>;
}

function Settings({data,save}:{data:Data;save:(d:Data)=>Promise<void>}){
 const [s,setS]=useState(data.settings);
 return <div className="admin-settings"><label>Brokerage phone<input value={s.phone} onChange={e=>setS({...s,phone:e.target.value})}/></label><label>Office address<input value={s.address} onChange={e=>setS({...s,address:e.target.value})}/></label><label>Public email<input value={s.email} onChange={e=>setS({...s,email:e.target.value})}/></label><label>Homepage headline<input value={s.homepageHeadline} onChange={e=>setS({...s,homepageHeadline:e.target.value})}/></label><button className="button button-dark" onClick={()=>save({...data,settings:s})}>Save settings</button></div>
}
