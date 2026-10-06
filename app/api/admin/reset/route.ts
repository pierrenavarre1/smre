import { NextResponse } from 'next/server';
import { resetPassword } from '../../../lib/admin-auth';

export async function POST(request:Request){
  const body=await request.json();
  const resetCode=String(body.resetCode || '');
  const newPassword=String(body.newPassword || '');
  if(newPassword.length<10) return NextResponse.json({error:'New password must be at least 10 characters.'},{status:400});
  if(!(await resetPassword(resetCode,newPassword))) return NextResponse.json({error:'Invalid reset code.'},{status:401});
  return NextResponse.json({ok:true});
}
