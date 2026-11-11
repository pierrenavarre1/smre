import { NextRequest, NextResponse } from 'next/server';
import { fetchMLSGridPage } from '../../lib/mlsgrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const cronAuthorized = Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
  // Preview deployments are protected by Vercel Deployment Protection.
  // Keep this read-only diagnostic available only on the dedicated test branch.
  const protectedPreview = process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'mls-incremental-sync-preview';
  return cronAuthorized || protectedPreview;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const source = request.nextUrl.searchParams.get('source') || 'flinthills';
  const listingNumber = request.nextUrl.searchParams.get('listingNumber') || '';
  if (source !== 'flinthills' && source !== 'sunflower') {
    return NextResponse.json({ error: 'Unsupported MLS source.' }, { status: 400 });
  }
  if (!/^[A-Za-z0-9-]{1,40}$/.test(listingNumber)) {
    return NextResponse.json({ error: 'A valid listingNumber is required.' }, { status: 400 });
  }
  if (!process.env.MLSGRID_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MLS Grid access token is not configured.' }, { status: 503 });
  }

  const filter = `OriginatingSystemName eq '${source}' and ListingId eq '${listingNumber}'`;
  const endpoint = 'https://api.mlsgrid.com/v2/Property?' + new URLSearchParams({
    '$filter': filter,
    '$select': 'ListingId,ListingKey,City,StandardStatus,MlgCanView,ModificationTimestamp,ListOfficeName,PostalCode',
    '$top': '2'
  }).toString();

  try {
    // Read-only diagnostic: no Blob, sync-state, cache, or public-data writes.
    const page = await fetchMLSGridPage(source, endpoint, false);
    const record = page.value?.[0];
    if (!record) return NextResponse.json({ ok: true, found: false, source, listingNumber, checkedBy: 'ListingId' });

    const city = String(record.City || '');
    const normalizedCity = city.toLowerCase().replace(/[.'’,-]/g, ' ').replace(/\s+/g, ' ').trim();
    const serviceCities = new Set([
      'st marys', 'saint marys', 'wamego', 'manhattan', 'topeka', 'st george', 'saint george',
      'rossville', 'silver lake', 'auburn', 'willard', 'berryton', 'dover', 'elmont', 'pauline',
      'tecumseh', 'wakarusa', 'leonardville', 'ogden', 'randolph', 'riley', 'fort riley', 'keats',
      'zeandale', 'belvue', 'bellevue', 'emmett', 'havensville', 'louisville', 'olsburg', 'onaga',
      'westmoreland', 'wheaton', 'blaine', 'duluth', 'flush', 'fostoria', 'st clere', 'saint clere',
      'alma', 'paxico', 'maple hill', 'eskridge', 'harveyville', 'mcfarland', 'junction city',
      'mayetta', 'holton'
    ]);

    return NextResponse.json({
      ok: true,
      found: true,
      source,
      listingNumber,
      listingId: String(record.ListingId || ''),
      listingKeyPresent: Boolean(record.ListingKey),
      city,
      inServiceArea: serviceCities.has(normalizedCity),
      standardStatus: String(record.StandardStatus || ''),
      canView: record.MlgCanView === true,
      modificationTimestamp: String(record.ModificationTimestamp || ''),
      officeNamePresent: Boolean(record.ListOfficeName)
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    console.error('MLS listing diagnostic failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'MLS Grid diagnostic request failed.', status: status || 500 }, {
      status: status === 429 ? 429 : 502
    });
  }
}
