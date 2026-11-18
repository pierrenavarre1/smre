import { NextResponse } from 'next/server';
import { getListings } from '../../lib/listings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const listings = await getListings();
  const value = listings
    .filter(p => p.StandardStatus === 'Active')
    .map(({ ListingId, StreetNumber, StreetName, City, StateOrProvince, PostalCode }) => ({
      ListingId, StreetNumber, StreetName, City, StateOrProvince, PostalCode
    }));
  return NextResponse.json({ value }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  });
}
