import { NextResponse } from 'next/server';
import { createSessionValue, sessionCookie, verifyPassword } from '../../../lib/admin-auth';

export async function POST(request:Request){
  const password=String((await request.json()).password || '');
  if(!process.env.ADMIN_PASSWORD && !process.env.ADMIN_RESET_CODE) return NextResponse.json({error:'Admin authentication is not configured.'},{status:503});
  if(!(await verifyPassword(password))) return NextResponse.json({error:'Incorrect password.'},{status:401});
  const response=NextResponse.json({ok:true});
  response.cookies.set(sessionCookie(createSessionValue()));
  return response;
}
