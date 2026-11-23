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
 const environment=process.env.VERCEL_ENV==='production'?'production':'preview';
 const environmentFilter=`environment eq '${environment}'`;
 const withFilter=(filter?:string)=>({filter:filter?`${environmentFilter} and (${filter})`:environmentFilter});
 try{
  const [total,byDay,byPage,byReferrer,byDevice,byCountry,byBrowser,byOs,byEvents,byListingViews,byPropertySearches,byLeadEvents]=await Promise.all([
   query('visits/count',{...range,...withFilter()}),
   query('visits/aggregate',{...range,...withFilter(),by:'day',limit:'100'}),
   query('visits/aggregate',{...range,...withFilter(),by:'requestPath',limit:'100'}),
   query('visits/aggregate',{...range,...withFilter(),by:'referrerHostname',limit:'100'}),
   query('visits/aggregate',{...range,...withFilter(),by:'deviceType',limit:'20'}),
   query('visits/aggregate',{...range,...withFilter(),by:'country',limit:'50'}),
   optionalQuery('visits/aggregate',{...range,...withFilter(),by:'browserName',limit:'20'}),
   optionalQuery('visits/aggregate',{...range,...withFilter(),by:'osName',limit:'20'}),
   optionalQuery('events/aggregate',{...range,...withFilter(),by:'eventName',limit:'30'}),
   optionalQuery('events/aggregate',{...range,...withFilter("eventName eq 'Listing View'"),by:'eventData/listingId',limit:'50'}),
   optionalQuery('events/aggregate',{...range,...withFilter("eventName eq 'Property Search'"),by:'eventData/propertyType',limit:'30'}),
   optionalQuery('events/aggregate',{...range,...withFilter("eventName eq 'Lead Submission'"),by:'eventData/inquiryType',limit:'20'})
  ]);
  return NextResponse.json({configured:true,days,environment,total,byDay,byPage,byReferrer,byDevice,byCountry,byBrowser,byOs,byEvents,byListingViews,byPropertySearches,byLeadEvents,customEventsAvailable:Boolean(byEvents||byListingViews||byPropertySearches||byLeadEvents),geographyNote:'Vercel Web Analytics API currently reports country, not city or state.'});
 }catch(error){
  console.error('Analytics query failed:',error);
  const detail=error instanceof Error?error.message:'Unknown analytics error';
  return NextResponse.json({error:'Unable to load analytics data.',detail},{status:502});
 }
}
