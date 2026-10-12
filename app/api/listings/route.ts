import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getListings } from '../../lib/listings';

export async function GET(){
  const listings = await getListings();
  return NextResponse.json({value:listings,count:listings.length});
}
