import { NextResponse } from 'next/server';
import { createSessionValue, sessionCookie } from '../../../lib/admin-auth';

export async function POST(request:Request){
  const password=String((await request.json()).password || '');
  if(!process.env.ADMIN_PASSWORD) return NextResponse.json({error:'ADMIN_PASSWORD is not configured.'},{status:503});
  if(password!==process.env.ADMIN_PASSWORD) return NextResponse.json({error:'Incorrect password.'},{status:401});
  const response=NextResponse.json({ok:true});
  response.cookies.set(sessionCookie(createSessionValue()));
  return response;
}
