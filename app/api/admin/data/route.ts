import { NextResponse } from 'next/server';
import { getAdminData, saveAdminData } from '../../../lib/admin-store';
import { isAdmin } from '../../../lib/admin-auth';

export async function GET(){
 if(!(await isAdmin())) return NextResponse.json({error:'Unauthorized'},{status:401});
 return NextResponse.json(await getAdminData());
}

export async function PUT(request:Request){
 if(!(await isAdmin())) return NextResponse.json({error:'Unauthorized'},{status:401});
 const data=await request.json();
 if(!data?.settings || !Array.isArray(data.agents) || !Array.isArray(data.guides) || !Array.isArray(data.leads)) return NextResponse.json({error:'Invalid data.'},{status:400});
 await saveAdminData(data);
 return NextResponse.json({ok:true});
}
