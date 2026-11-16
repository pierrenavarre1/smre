import {NextRequest,NextResponse} from 'next/server';
import {isAdmin} from '../../../lib/admin-auth';

export const dynamic='force-dynamic';

type TokenResponse={access_token?:string;accessToken?:string;error?:string|{code?:number;message?:string;status?:string;details?:unknown[]};error_description?:string};
function googleError(data:TokenResponse,status:number){
 const e=data.error;
 if(e&&typeof e==='object')return [e.message,e.status,e.details?JSON.stringify(e.details):''].filter(Boolean).join(' | ')||'Google API error '+status;
 return data.error_description||e||'Google API error '+status;
}
async function googleAccessToken(request:NextRequest){
 const projectNumber=process.env.GCP_PROJECT_NUMBER;
 const poolId=process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
 const providerId=process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
 const serviceAccount=process.env.GCP_SERVICE_ACCOUNT_EMAIL;
 const oidcToken=request.headers.get('x-vercel-oidc-token')||process.env.VERCEL_OIDC_TOKEN;
 if(!projectNumber||!poolId||!providerId||!serviceAccount||!oidcToken){
  const missing=[
   !projectNumber&&'GCP_PROJECT_NUMBER',
   !poolId&&'GCP_WORKLOAD_IDENTITY_POOL_ID',
   !providerId&&'GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID',
   !serviceAccount&&'GCP_SERVICE_ACCOUNT_EMAIL',
   !oidcToken&&'Vercel OIDC token (x-vercel-oidc-token)'
  ].filter(Boolean);
  throw new Error('Workload Identity Federation is not configured: '+missing.join(', '));
 }
 const audience='//iam.googleapis.com/projects/'+projectNumber+'/locations/global/workloadIdentityPools/'+poolId+'/providers/'+providerId;
 const exchange=await fetch('https://sts.googleapis.com/v1/token',{
  method:'POST',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({
   grant_type:'urn:ietf:params:oauth:grant-type:token-exchange',
   audience,
   requested_token_type:'urn:ietf:params:oauth:token-type:access_token',
   subject_token_type:'urn:ietf:params:oauth:token-type:jwt',
   subject_token:oidcToken,
   scope:'https://www.googleapis.com/auth/cloud-platform'
  }),
  cache:'no-store'
 });
 const exchangeData=await exchange.json() as TokenResponse;
 if(!exchange.ok||!exchangeData.access_token)throw new Error('Google STS token exchange failed: '+googleError(exchangeData,exchange.status));
 const impersonationUrl='https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/'+encodeURIComponent(serviceAccount)+':generateAccessToken';
 const impersonation=await fetch(impersonationUrl,{
  method:'POST',
  headers:{Authorization:'Bearer '+exchangeData.access_token,'Content-Type':'application/json'},
  body:JSON.stringify({scope:['https://www.googleapis.com/auth/webmasters.readonly'],lifetime:'3600s'}),
  cache:'no-store'
 });
 const impersonationData=await impersonation.json() as TokenResponse;
 const accessToken=impersonationData.accessToken||impersonationData.access_token;
 if(!impersonation.ok||!accessToken)throw new Error('Google service-account impersonation failed: '+googleError(impersonationData,impersonation.status)+'. Check the service account Workload Identity User binding for this Vercel environment.');
 return accessToken;
}

async function query(token:string,site:string,startDate:string,endDate:string,dimensions:string[]){
 const url='https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(site)+'/searchAnalytics/query';
 const response=await fetch(url,{
  method:'POST',
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({startDate,endDate,dimensions,rowLimit:50}),
  cache:'no-store'
 });
 if(!response.ok)throw new Error('Search Console query failed: '+(await response.text()).slice(0,600));
 return response.json();
}

export async function GET(request:NextRequest){
 if(!(await isAdmin()))return NextResponse.json({error:'Unauthorized'},{status:401});
 const site=process.env.GSC_SITE_URL||'';
 const required=['GSC_SITE_URL','GCP_PROJECT_NUMBER','GCP_WORKLOAD_IDENTITY_POOL_ID','GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID','GCP_SERVICE_ACCOUNT_EMAIL'];
 const missing=required.filter(key=>!process.env[key]);
 if(missing.length||!site)return NextResponse.json({configured:false,required:missing.length?missing:['GSC_SITE_URL']});
 try{
  const days=Math.min(90,Math.max(7,Number(request.nextUrl.searchParams.get('days')||30)));
  const end=new Date(Date.now()-3*86400000),start=new Date(end.getTime()-days*86400000);
  const iso=(d:Date)=>d.toISOString().slice(0,10);
  const from=iso(start),to=iso(end),token=await googleAccessToken(request);
  const [queries,pages,countries,devices]=await Promise.all([
   query(token,site,from,to,['query']),
   query(token,site,from,to,['page']),
   query(token,site,from,to,['country']),
   query(token,site,from,to,['device'])
  ]);
  return NextResponse.json({configured:true,startDate:from,endDate:to,queries:queries.rows||[],pages:pages.rows||[],countries:countries.rows||[],devices:devices.rows||[]});
 }catch(error){
  const detail=error instanceof Error?error.message:'Unknown Search Console error';
  return NextResponse.json({error:'Unable to load Google Search Console data.',detail},{status:502});
 }
}
