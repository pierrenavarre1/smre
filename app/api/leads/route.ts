import { NextResponse } from 'next/server';
import { addLead } from '../../lib/admin-store';

function splitName(name:string){
  const parts=name.trim().split(/\s+/).filter(Boolean);
  return {firstName:parts.shift() || '',lastName:parts.join(' ')};
}

function formatRequestedDate(value: unknown){
  const raw=String(value || '').trim();
  const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match) return raw;
  return new Date(Number(match[1]),Number(match[2])-1,Number(match[3])).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
}

function formatRequestedTime(value: unknown){
  const raw=String(value || '').trim();
  const match=raw.match(/^(\d{1,2}):(\d{2})$/);
  if(!match) return raw;
  const hour=Number(match[1]);
  const minute=Number(match[2]);
  if(hour>23 || minute>59) return raw;
  return new Date(2000,0,1,hour,minute).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
}

export async function POST(request:Request){
  try{
    const lead=await request.json();
    if(!lead?.name || (!lead?.email && !lead?.phone && !lead?.contact)) return NextResponse.json({error:'Name and contact information are required.'},{status:400});

    await addLead({type:lead.type==='showing'?'Showing Request':lead.type==='seller'||lead.type==='valuation'?'Seller Inquiry':lead.type==='property'?'Property Inquiry':'General Inquiry',name:String(lead.name),email:lead.email?String(lead.email):undefined,phone:lead.phone?String(lead.phone):undefined,address:lead.address?String(lead.address):undefined,listingId:lead.listingId?String(lead.listingId):undefined,message:lead.message?String(lead.message):undefined});

    const apiKey=process.env.FUB_API_KEY;
    const systemKey=process.env.FUB_SYSTEM_KEY;

    if(apiKey && systemKey){
      const {firstName,lastName}=splitName(String(lead.name));
      const contact=String(lead.contact || '');
      const email=String(lead.email || (contact.includes('@')?contact:''));
      const phone=String(lead.phone || (!contact.includes('@')?contact:''));
      const eventType=lead.type==='seller'?'Seller Inquiry':lead.type==='valuation'?'Seller Inquiry':lead.type==='showing'?'Property Inquiry':lead.type==='property'?'Property Inquiry':lead.type==='chat'?'General Inquiry':'General Inquiry';
      const event={
        source:'SMRE Website Preview',
        system:'SMRE-Website',
        type:eventType,
        message:lead.type==='showing'?[
          'SHOWING REQUEST',
          `Property: ${String(lead.address || 'Address not provided')}`,
          lead.preferredDate?`Requested date: ${formatRequestedDate(lead.preferredDate)}`:'',
          lead.preferredTime?`Requested time: ${formatRequestedTime(lead.preferredTime)}`:'',
          lead.listingId?`MLS/Listing ID: ${String(lead.listingId)}`:'',
          String(lead.message || '').trim()? `Additional details: ${String(lead.message).trim()}`:''
        ].filter(Boolean).join('\n'): [
          lead.listingId?`MLS/Listing ID: ${String(lead.listingId)}`:'',
          lead.preferredDate?`Preferred date: ${String(lead.preferredDate)}`:'',
          lead.preferredTime?`Preferred time: ${String(lead.preferredTime)}`:'',
          String(lead.message || '')
        ].filter(Boolean).join('\n'),
        sourceUrl:`https://${request.headers.get('host') || 'smre-preview.vercel.app'}`,
        person:{
          firstName,
          lastName,
          ...(email?{emails:[{value:email}]}:{}),
          ...(phone?{phones:[{value:phone}]}:{}),
          ...(lead.address?{addresses:[{street:lead.address}]}:{}),
        },
      };

      try{
        const response=await fetch('https://api.followupboss.com/v1/events',{
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'X-System':'SMRE-Website',
            'X-System-Key':systemKey,
            'Authorization':`Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          },
          body:JSON.stringify(event),
          signal:AbortSignal.timeout(8000),
        });
        if(!response.ok){
          console.error('FUB lead submission failed',response.status);
          return NextResponse.json({ok:true,forwarded:false,crmWarning:true});
        }
      }catch(fubError){
        console.error('FUB lead submission could not complete',fubError instanceof Error?fubError.message:'Unknown error');
        return NextResponse.json({ok:true,forwarded:false,crmWarning:true});
      }
    }

    return NextResponse.json({ok:true,forwarded:Boolean(apiKey && systemKey)});
  }catch(error){
    console.error('Lead submission error',error);
    return NextResponse.json({error:'Unable to submit request.'},{status:400});
  }
}
