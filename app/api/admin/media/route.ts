import { NextResponse } from 'next/server';
import { del, list, put } from '@vercel/blob';
import { isAdmin } from '../../../lib/admin-auth';

export async function GET(){
 if(!(await isAdmin()))return NextResponse.json({error:'Unauthorized'},{status:401});
 const result=await list({prefix:'admin/media/'});
 return NextResponse.json({blobs:result.blobs.map(b=>({url:b.url,pathname:b.pathname,size:b.size,uploadedAt:b.uploadedAt}))});
}
export async function POST(request:Request){
 if(!(await isAdmin()))return NextResponse.json({error:'Unauthorized'},{status:401});
 const form=await request.formData();const file=form.get('file');
 if(!(file instanceof File))return NextResponse.json({error:'Image file required.'},{status:400});
 if(!file.type.startsWith('image/'))return NextResponse.json({error:'Only image files are allowed.'},{status:400});
 if(file.size>10*1024*1024)return NextResponse.json({error:'Images must be 10 MB or smaller.'},{status:400});
 const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
 const blob=await put('admin/media/'+Date.now()+'-'+safe,file,{access:'public',addRandomSuffix:true});
 return NextResponse.json({blob});
}
export async function DELETE(request:Request){
 if(!(await isAdmin()))return NextResponse.json({error:'Unauthorized'},{status:401});
 const pathname=new URL(request.url).searchParams.get('pathname');
 if(!pathname)return NextResponse.json({error:'Pathname required.'},{status:400});
 await del(pathname);
 return NextResponse.json({ok:true});
}