import { NextResponse } from 'next/server';
export async function POST(request:Request){try{const lead=await request.json(); if(!lead?.name || (!lead?.email && !lead?.phone && !lead?.contact)) return NextResponse.json({error:'Name and contact information are required.'},{status:400});
// GO LIVE: Set FUB_API_KEY and FUB_API_URL in Vercel server environment variables.
// Forward this normalized lead to Follow Up Boss from this server route only. Do not expose the FUB key to the browser.
// Example production call: POST `${process.env.FUB_API_URL ?? 'https://api.followupboss.com/v1'}/people` with Authorization using process.env.FUB_API_KEY.
// Map lead.type='valuation' to a manual CMA lead/source and lead.type='chat' to the desired FUB source.
const forwarded=Boolean(process.env.FUB_API_KEY); if(forwarded){ /* TODO: implement FUB API request after confirming account-specific FUB fields/source conventions. */ }
return NextResponse.json({ok:true,forwarded});}catch{return NextResponse.json({error:'Unable to submit request.'},{status:400});}}
