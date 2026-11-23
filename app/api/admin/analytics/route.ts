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
 const response=await fetch(apiUrl(path,{projectId:PROJECT_ID,teamId:TEAM_ID,...params}),{
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  cache:'no-store'
 });
 const body=await response.text();
 if(!response.ok){
  const detail=body.slice(0,1200);
  throw new Error(`Vercel Analytics ${path} returned HTTP ${response.status}: ${detail}`);
 }
 try{return JSON.parse(body)}catch{return {raw:body}}
}

async function optionalQuery(path:string,params:Record<string,string>){try{return await query(path,params)}catch(error){console.warn('Optional analytics dimension unavailable:',path,error);return null}}

export async function GET(request:NextRequest){
 if(!(await isAdmin())) return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!process.env.VERCEL_ANALYTICS_TOKEN) return NextResponse.json({configured:false});
 const days=Math.min(90,Math.max(1,Number(request.nextUrl.searchParams.get('days')||30)));
 const until=new Date().toISOString().slice(0,10);
 const since=new Date(Date.now()-days*86400000).toISOString().slice(0,10);
 const range={since,until};
 try{
  const [total,byDay,byPage,byReferrer,byDevice,byCountry,byBrowser,byOs,byEvents,byListingViews,byPropertySearches,byLeadEvents]=await Promise.all([
   query('visits/count',range),
   query('visits/aggregate',{...range,by:'day',limit:'100'}),
   query('visits/aggregate',{...range,by:'requestPath',limit:'100'}),
   query('visits/aggregate',{...range,by:'referrerHostname',limit:'100'}),
   query('visits/aggregate',{...range,by:'deviceType',limit:'20'}),
   query('visits/aggregate',{...range,by:'country',limit:'50'}),
   optionalQuery('visits/aggregate',{...range,by:'browserName',limit:'20'}),
   optionalQuery('visits/aggregate',{...range,by:'osName',limit:'20'}),
   optionalQuery('events/aggregate',{...range,by:'eventName',limit:'30'}),
   optionalQuery('events/aggregate',{...range,by:'eventData/listingId',filter:"eventName eq 'Listing View'",limit:'50'}),
   optionalQuery('events/aggregate',{...range,by:'eventData/propertyType',filter:"eventName eq 'Property Search'",limit:'30'}),
   optionalQuery('events/aggregate',{...range,by:'eventData/inquiryType',filter:"eventName eq 'Lead Submission'",limit:'20'})
  ]);
  const hasRows=(value:any)=>Array.isArray(value?.data)?value.data.length>0:Array.isArray(value?.rows)?value.rows.length>0:Array.isArray(value)?value.length>0:Boolean(value&&typeof value==='object'&&Object.keys(value).length>0);
  const customEventsAvailable=[byEvents,byListingViews,byPropertySearches,byLeadEvents].some(hasRows);
  return NextResponse.json({configured:true,days,total,byDay,byPage,byReferrer,byDevice,byCountry,byBrowser,byOs,byEvents,byListingViews,byPropertySearches,byLeadEvents,customEventsAvailable,geographyNote:'Vercel Web Analytics API currently reports country, not city or state.'});
 }catch(error){
  console.error('Analytics query failed:',error);
  const detail=error instanceof Error?error.message:'Unknown analytics error';
  return NextResponse.json({error:'Unable to load analytics data.',detail},{status:502});
 }
}
