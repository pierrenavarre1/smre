import { NextResponse } from 'next/server';
import { getListings } from '../../lib/listings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const listings = await getListings();
  const value = listings
    .filter(p => p.StandardStatus === 'Active' && Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude) && p.Latitude !== 0 && p.Longitude !== 0)
    .map(({ ListingId, ListPrice, BedroomsTotal, BathroomsTotalInteger, StreetNumber, StreetName, City, StateOrProvince, LivingArea, Media, Latitude, Longitude }) => ({
      ListingId, ListPrice, BedroomsTotal, BathroomsTotalInteger, StreetNumber, StreetName, City, StateOrProvince, LivingArea,
      Media: Media.slice(0, 1).map(({ MediaURL }) => ({ MediaURL })),
      Latitude, Longitude
    }));
  return NextResponse.json({ value }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  });
}
