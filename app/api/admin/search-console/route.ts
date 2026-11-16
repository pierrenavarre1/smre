import {NextRequest,NextResponse} from 'next/server';
import {createSign} from 'crypto';
import {isAdmin} from '../../../../lib/admin-auth';

export const dynamic='force-dynamic';
function b64(value:string|Buffer){return Buffer.from(value).toString('base64url');}
async function accessToken(){
 const email=process.env.GSC_CLIENT_EMAIL;
 const key=(process.env.GSC_PRIVATE_KEY||'').replace(/\\n/g,'\n');
 if(!email||!key)return null;
 const now=Math.floor(Date.now()/1000);
 const unsigned=b64(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+b64(JSON.stringify({iss:email,scope:'https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const signer=createSign('RSA-SHA256');signer.update(unsigned);signer.end();
 const assertion=unsigned+'.'+signer.sign(key,'base64url');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),cache:'no-store'});
 if(!response.ok)throw new Error('Google authorization failed: '+(await response.text()).slice(0,500));
 const data=await response.json();return String(data.access_token||'');
}
async function query(token:string,site:string,startDate:string,endDate:string,dimensions:string[]){
 const url='https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(site)+'/searchAnalytics/query';
 const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({startDate,endDate,dimensions,rowLimit:50}),cache:'no-store'});
 if(!response.ok)throw new Error('Search Console query failed: '+(await response.text()).slice(0,600));
 return response.json();
}
export async function GET(request:NextRequest){
 if(!(await isAdmin()))return NextResponse.json({error:'Unauthorized'},{status:401});
 const site=process.env.GSC_SITE_URL||'';
 if(!process.env.GSC_CLIENT_EMAIL||!process.env.GSC_PRIVATE_KEY||!site)return NextResponse.json({configured:false,required:['GSC_CLIENT_EMAIL','GSC_PRIVATE_KEY','GSC_SITE_URL']});
 try{
  const days=Math.min(90,Math.max(7,Number(request.nextUrl.searchParams.get('days')||30)));
  const end=new Date(Date.now()-3*86400000),start=new Date(end.getTime()-days*86400000);
  const iso=(d:Date)=>d.toISOString().slice(0,10),from=iso(start),to=iso(end),token=await accessToken();
  if(!token)return NextResponse.json({configured:false});
  const [queries,pages,countries,devices]=await Promise.all([query(token,site,from,to,['query']),query(token,site,from,to,['page']),query(token,site,from,to,['country']),query(token,site,from,to,['device'])]);
  return NextResponse.json({configured:true,startDate:from,endDate:to,queries:queries.rows||[],pages:pages.rows||[],countries:countries.rows||[],devices:devices.rows||[]});
 }catch(error){const detail=error instanceof Error?error.message:'Unknown Search Console error';return NextResponse.json({error:'Unable to load Google Search Console data.',detail},{status:502});}
}
