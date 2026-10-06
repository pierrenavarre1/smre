import { get, put } from '@vercel/blob';
import { agents as seedAgents, type AgentProfile } from './agents';
import { guides as seedGuides, type Guide } from './guides';

export type AdminLead={id:string;createdAt:string;type:string;name:string;email?:string;phone?:string;address?:string;listingId?:string;message?:string;status:'new'|'contacted'|'closed'};
export type SiteSettings={phone:string;address:string;email:string;homepageHeadline:string};
export type AdminData={settings:SiteSettings;agents:AgentProfile[];guides:Guide[];leads:AdminLead[]};

const PATH='admin/site-data.json';

const seed:AdminData={
 settings:{phone:'(785) 465-2543',address:'512 W Bertrand Ave, St Marys, KS 66536',email:'',homepageHeadline:'REAL ESTATE, Close to Home.'},
 agents:seedAgents,
 guides:seedGuides,
 leads:[]
};

async function read(){
 try{
  const result=await get(PATH,{access:'private',useCache:false});
  if(!result) return null;
  return JSON.parse(await new Response(result.stream).text()) as AdminData;
 }catch{return null;}
}

export async function getAdminData():Promise<AdminData>{
 const existing=await read();
 if(existing)return existing;
 await put(PATH,JSON.stringify(seed),{access:'private',allowOverwrite:true});
 return seed;
}

export async function saveAdminData(data:AdminData){
 await put(PATH,JSON.stringify(data),{access:'private',allowOverwrite:true});
 return data;
}

export async function addLead(input:Omit<AdminLead,'id'|'createdAt'|'status'>){
 const data=await getAdminData();
 const lead:AdminLead={...input,id:crypto.randomUUID(),createdAt:new Date().toISOString(),status:'new'};
 data.leads=[lead,...data.leads].slice(0,1000);
 await saveAdminData(data);
 return lead;
}
