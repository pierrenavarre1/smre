import { get, put } from '@vercel/blob';
import { agents as seedAgents, type AgentProfile } from './agents';
import { guides as seedGuides, type Guide } from './guides';

export type AdminLead={
 id:string;createdAt:string;type:string;name:string;email?:string;phone?:string;address?:string;listingId?:string;message?:string;
 status:'new'|'contacted'|'closed';assignedAgent?:string;notes?:string;lastContactedAt?:string;nextFollowUpAt?:string;
};
export type SiteSettings={
 phone:string;address:string;email:string;homepageHeadline:string;officeHours:string;facebook:string;instagram:string;youtube:string;googleBusiness:string;
 defaultTitle:string;defaultDescription:string;ogImage:string;leadNotificationEmail:string;
 heroEyebrow:string;heroDescription:string;localHeading:string;localDescription:string;localImage:string;featuredCount:number;
};
export type AdminTestimonial={id:string;name:string;quote:string;rating:number;source:string;date?:string;featured:boolean;sort:number};
export type AdminData={settings:SiteSettings;agents:AgentProfile[];guides:Guide[];leads:AdminLead[];testimonials:AdminTestimonial[];updatedAt?:string};
const PATH='admin/site-data.json';

const seed:AdminData={
 settings:{
  phone:'(785) 465-2543',address:'512 W Bertrand Ave, St Marys, KS 66536',email:'admin@smre.info',homepageHeadline:'REAL ESTATE, Close to Home.',
  officeHours:'By appointment',facebook:'',instagram:'',youtube:'',googleBusiness:'',
  defaultTitle:'St. Mary’s Real Estate | SMRE',defaultDescription:'St. Mary’s Real Estate serves St. Marys, Wamego, and the surrounding Topeka–Manhattan market.',ogImage:'',leadNotificationEmail:'admin@smre.info',
  heroEyebrow:'LOCAL REAL ESTATE',heroDescription:'Local knowledge, straightforward advice, and real estate experience across Northeast Kansas.',
  localHeading:'Small towns. Open country. Real local knowledge.',localDescription:'From St. Marys and Wamego to the farms, acreage, and communities between Topeka and Manhattan, we understand that buying here is about more than an address.',
  localImage:'/images/ChatGPT Image Sep 30, 2026, 02_28_25 PM.png',featuredCount:6
 },
 agents:seedAgents,guides:seedGuides,leads:[],
 testimonials:[
  {id:'patrick',name:'Patrick',quote:'Never missed a call from me throughout the entire two-month process.',rating:5,source:'Client review',featured:true,sort:1},
  {id:'jim',name:'Jim',quote:'They walked us through the process and helped us with our first home purchase.',rating:5,source:'Client review',featured:true,sort:2},
  {id:'anne',name:'Anne',quote:'Michael Kirby made my purchase experience very easy for an out-of-state buyer moving to St. Marys.',rating:5,source:'Client review',featured:true,sort:3}
 ]
};

function normalize(data:Partial<AdminData>):AdminData{
 const s={...seed.settings,...(data.settings||{})};
 const agents=(data.agents||seed.agents).map((a:any)=>({...seed.agents.find(x=>x.slug===a.slug),...a}));
 const guides=(data.guides||seed.guides).map((g:any)=>({...seed.guides.find(x=>x.slug===g.slug),...g}));
 const leads=(data.leads||[]).map((l:any)=>({status:'new',...l}));
 const testimonials=(data.testimonials||seed.testimonials).map((t:any)=>({featured:false,sort:99,...t}));
 return {...seed,...data,settings:{...s,featuredCount:Number(s.featuredCount)||6},agents,guides,leads,testimonials};
}
const ADMIN_CACHE_MS=60_000;
let adminMemoryCache:{data:AdminData;expiresAt:number}|null=null;

async function read(){
 try{const result=await get(PATH,{access:'private',useCache:true});if(!result)return null;return JSON.parse(await new Response(result.stream).text()) as AdminData}catch{return null}
}
export async function getAdminData(){
 if(adminMemoryCache && adminMemoryCache.expiresAt>Date.now()) return adminMemoryCache.data;
 const existing=await read();
 if(existing){const data=normalize(existing);adminMemoryCache={data,expiresAt:Date.now()+ADMIN_CACHE_MS};return data;}
 const data={...seed,updatedAt:new Date().toISOString()};
 await put(PATH,JSON.stringify(data),{access:'private',allowOverwrite:true});
 adminMemoryCache={data,expiresAt:Date.now()+ADMIN_CACHE_MS};
 return data;
}
export async function saveAdminData(input:AdminData){const data=normalize({...input,updatedAt:new Date().toISOString()});await put(PATH,JSON.stringify(data),{access:'private',allowOverwrite:true});adminMemoryCache={data,expiresAt:Date.now()+ADMIN_CACHE_MS};return data}
export async function addLead(input:Omit<AdminLead,'id'|'createdAt'|'status'>){
 const data=await getAdminData();const lead:AdminLead={...input,id:crypto.randomUUID(),createdAt:new Date().toISOString(),status:'new'};
 data.leads=[lead,...data.leads].slice(0,1000);await saveAdminData(data);return lead;
}