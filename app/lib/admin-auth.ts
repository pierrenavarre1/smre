import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE='smre_admin_session';
const TTL=1000*60*60*12;

function secret(){return process.env.ADMIN_PASSWORD || '';}
function sign(value:string){return createHmac('sha256',secret()).update(value).digest('hex');}

export function createSessionValue(){
  const value=`${Date.now()}.${crypto.randomUUID()}`;
  return `${value}.${sign(value)}`;
}

export function validSession(value:string|null){
  if(!value || !secret()) return false;
  const parts=value.split('.');
  if(parts.length<3) return false;
  const [issued,...rest]=parts;
  const sig=rest.pop() || '';
  const payload=[issued,...rest].join('.');
  const age=Date.now()-Number(issued);
  if(!Number.isFinite(age) || age<0 || age>TTL) return false;
  const expected=sign(payload);
  return sig.length===expected.length && timingSafeEqual(Buffer.from(sig),Buffer.from(expected));
}

export async function isAdmin(){
  return validSession((await cookies()).get(COOKIE)?.value || null);
}

export function sessionCookie(value:string){
  return {name:COOKIE,value,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*12};
}

export const sessionCookieName=COOKIE;
