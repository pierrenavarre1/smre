import { NextResponse } from 'next/server';

function splitName(name:string){
  const parts=name.trim().split(/\s+/).filter(Boolean);
  return {firstName:parts.shift() || '',lastName:parts.join(' ')};
}

export async function POST(request:Request){
  try{
    const lead=await request.json();
    if(!lead?.name || (!lead?.email && !lead?.phone && !lead?.contact)) return NextResponse.json({error:'Name and contact information are required.'},{status:400});

    const apiKey=process.env.FUB_API_KEY;
    const systemKey=process.env.FUB_SYSTEM_KEY;

    if(apiKey && systemKey){
      const {firstName,lastName}=splitName(String(lead.name));
      const contact=String(lead.contact || '');
      const email=String(lead.email || (contact.includes('@')?contact:''));
      const phone=String(lead.phone || (!contact.includes('@')?contact:''));
      const eventType=lead.type==='seller'?'Seller Inquiry':lead.type==='valuation'?'Seller Inquiry':lead.type==='chat'?'General Inquiry':'General Inquiry';
      const event={
        source:'smre.info',
        system:'SMRE Website',
        type:eventType,
        message:String(lead.message || ''),
        sourceUrl:'https://smre.info',
        person:{
          firstName,
          lastName,
          ...(email?{emails:[{value:email}]}:{}),
          ...(phone?{phones:[{value:phone}]}:{}),
          ...(lead.address?{addresses:[{street:lead.address}]}:{}),
        },
      };

      const response=await fetch('https://api.followupboss.com/v1/events',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'X-System':'SMRE Website',
          'X-System-Key':systemKey,
          'Authorization':`Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        },
        body:JSON.stringify(event),
      });
      if(!response.ok){
        console.error('FUB lead submission failed',response.status,await response.text());
        return NextResponse.json({error:'Unable to submit request.'},{status:502});
      }
    }

    return NextResponse.json({ok:true,forwarded:Boolean(apiKey && systemKey)});
  }catch(error){
    console.error('Lead submission error',error);
    return NextResponse.json({error:'Unable to submit request.'},{status:400});
  }
}
