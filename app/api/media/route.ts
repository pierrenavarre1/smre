import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export async function GET(request:Request){
 const pathname=new URL(request.url).searchParams.get('pathname');
 if(!pathname || !pathname.startsWith('admin/media/')) return new NextResponse('Not found',{status:404});
 const result=await get(pathname,{access:'private',useCache:false});
 if(!result) return new NextResponse('Not found',{status:404});
 return new Response(result.stream,{headers:{'Content-Type':result.blob.contentType||'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable'}});
}