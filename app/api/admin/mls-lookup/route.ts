import { NextResponse } from 'next/server';
import { isAdmin } from '../../../lib/admin-auth';
import { dedupeListings, fetchMLSGridListingsByNumber } from '../../../lib/mlsgrid';
import { readMLSCache, writeMLSCache } from '../../../lib/mls-store';
import type { RESOProperty } from '../../../lib/mock-properties';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isDurablePhoto(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'cdn-stmarys.mlsgrid.com';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  let body: { mlsNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter a valid MLS number.' }, { status: 400 });
  }

  const mlsNumber = String(body.mlsNumber || '').trim();
  if (!mlsNumber || mlsNumber.length > 40 || !/^[a-zA-Z0-9-]+$/.test(mlsNumber)) {
    return NextResponse.json({ error: 'Enter a valid MLS number.' }, { status: 400 });
  }

  try {
    const matches = await fetchMLSGridListingsByNumber(mlsNumber);
    if (!matches.length) {
      return NextResponse.json({ error: 'No matching active or pending listing was found in the configured MLS feeds and service area.' }, { status: 404 });
    }
    if (matches.length > 1) {
      return NextResponse.json({
        error: 'This MLS number matched more than one feed. No cache changes were made.',
        matches: matches.map(item => ({ listingId: item.ListingId, source: item.MlsSource, address: [item.StreetNumber, item.StreetName, item.City].filter(Boolean).join(' ') }))
      }, { status: 409 });
    }

    const fresh = matches[0];
    const current = await readMLSCache();
    const existing = current.find(item => item.ListingId === fresh.ListingId);
    const freshHasDurableGallery = fresh.Media.length > 0 && fresh.Media.every(photo => isDurablePhoto(photo.MediaURL));
    const safeListing: RESOProperty = {
      ...fresh,
      // MLS Grid media URLs can be short-lived. Never persist signed URLs in
      // the shared listing cache; retain the last known durable gallery unless
      // the feed provides the provisioned SMRE CDN URLs.
      Media: freshHasDurableGallery ? fresh.Media : (existing?.Media || [])
    };
    const next = dedupeListings([
      ...current.filter(item => item.ListingId !== safeListing.ListingId),
      safeListing
    ]);
    await writeMLSCache(next);

    return NextResponse.json({
      ok: true,
      listing: {
        listingId: safeListing.ListingId,
        mlsNumber: safeListing.MLSNumber || mlsNumber,
        address: [safeListing.StreetNumber, safeListing.StreetName, safeListing.City, safeListing.StateOrProvince].filter(Boolean).join(' '),
        price: safeListing.ListPrice,
        status: safeListing.StandardStatus,
        source: safeListing.MlsSource,
        photoCount: safeListing.Media.length,
        photosRefreshed: freshHasDurableGallery
      },
      message: existing ? 'Listing refreshed in the website cache.' : 'Listing added to the website cache.'
    });
  } catch (error) {
    console.error('Admin MLS lookup failed:', error);
    const status = (error as Error & { status?: number }).status;
    return NextResponse.json({
      error: status === 429
        ? 'MLS Grid is temporarily limiting requests. No listing data was changed. Try again later.'
        : 'MLS Grid lookup failed. No listing data was changed.'
    }, { status: status === 429 ? 429 : 502 });
  }
}
