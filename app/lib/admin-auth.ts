import { createHmac, createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { get, put } from '@vercel/blob';
import { cookies } from 'next/headers';

const COOKIE='smre_admin_session';
const TTL=1000*60*60*12;
const AUTH_PATH='admin/auth.json';

type AuthState={salt:string;hash:string};

async function readAuth():Promise<AuthState|null>{
  try{
    const result=await get(AUTH_PATH,{access:'private',useCache:false});
    if(!result) return null;
    return JSON.parse(await new Response(result.stream).text()) as AuthState;
  }catch{return null;}
}

function hashPassword(password:string,salt:string){
  return scryptSync(password,salt,64).toString('hex');
}

async function writeAuth(password:string){
  const salt=randomBytes(16).toString('hex');
  const hash=hashPassword(password,salt);
  await put(AUTH_PATH,JSON.stringify({salt,hash}),{access:'private',allowOverwrite:true});
}

export async function verifyPassword(password:string){
  const state=await readAuth();
  if(state){
    const expected=hashPassword(password,state.salt);
    return expected.length===state.hash.length && timingSafeEqual(Buffer.from(expected),Buffer.from(state.hash));
  }
  const bootstrap=process.env.ADMIN_PASSWORD || '';
  if(!bootstrap || password!==bootstrap) return false;
  await writeAuth(bootstrap);
  return true;
}

export async function resetPassword(resetCode:string,newPassword:string){
  const expected=process.env.ADMIN_RESET_CODE || '';
  if(!expected || !resetCode || resetCode!==expected) return false;
  if(newPassword.length<10) return false;
  await writeAuth(newPassword);
  return true;
}

function sessionSecret(){
  const reset=process.env.ADMIN_RESET_CODE || '';
  const bootstrap=process.env.ADMIN_PASSWORD || '';
  return reset || bootstrap || 'smre-admin-unconfigured';
}

function sign(value:string){return createHmac('sha256',sessionSecret()).update(value).digest('hex');}

export function createSessionValue(){
  const value=`${Date.now()}.${crypto.randomUUID()}`;
  return `${value}.${sign(value)}`;
}

export function validSession(value:string|null){
  if(!value) return false;
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
