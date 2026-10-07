import {NextRequest,NextResponse} from 'next/server';
import {isAdmin} from '../../../lib/admin-auth';

export const dynamic='force-dynamic';

const PROJECT_ID=process.env.VERCEL_PROJECT_ID||'prj_a77otCgDgvzF3yZxtLHXtmeONdxs';
const TEAM_ID=process.env.VERCEL_TEAM_ID||'team_1N4WZIDBxwrALlqvIK3A1MXo';

function apiUrl(path:string,params:Record<string,string>){
 const u=new URL('https://api.vercel.com/v1/query/web-analytics/'+path);
 Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
 return u;
}

async function query(path:string,params:Record<string,string>){
 const token=process.env.VERCEL_ANALYTICS_TOKEN;
 if(!token) return null;
 const r=await fetch(apiUrl(path,{projectId:PROJECT_ID,teamId:TEAM_ID,...params}),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
 if(!r.ok) throw new Error('Vercel Analytics API returned '+r.status);
 return r.json();
}

export async function GET(request:NextRequest){
 if(!(await isAdmin())) return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!process.env.VERCEL_ANALYTICS_TOKEN) return NextResponse.json({configured:false});
 const days=Math.min(90,Math.max(1,Number(request.nextUrl.searchParams.get('days')||30)));
 const since=new Date(Date.now()-days*86400000).toISOString();
 try{
  const [total,byDay,byPage,byReferrer,byDevice,byCountry]=await Promise.all([
   query('visits/count',{since}),
   query('visits/aggregate',{since,until:new Date().toISOString(),by:'day'}),
   query('visits/aggregate',{since,until:new Date().toISOString(),by:'requestPath'}),
   query('visits/aggregate',{since,until:new Date().toISOString(),by:'referrerHostname'}),
   query('visits/aggregate',{since,until:new Date().toISOString(),by:'deviceType'}),
   query('visits/aggregate',{since,until:new Date().toISOString(),by:'country'})
  ]);
  return NextResponse.json({configured:true,days,total,byDay,byPage,byReferrer,byDevice,byCountry});
 }catch(error){
  console.error('Analytics query failed:',error);
  return NextResponse.json({error:'Unable to load analytics data.'},{status:502});
 }
}
