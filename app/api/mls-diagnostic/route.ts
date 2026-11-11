import { NextRequest, NextResponse } from 'next/server';
import { fetchMLSGridPage } from '../../lib/mlsgrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const cronAuthorized = Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
  const protectedPreview = process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'mls-incremental-sync-preview';
  return cronAuthorized || protectedPreview;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const requestedSource = request.nextUrl.searchParams.get('source') || 'flinthills';
  const listingNumber = request.nextUrl.searchParams.get('listingNumber') || '';
  if (requestedSource !== 'flinthills' && requestedSource !== 'sunflower') {
    return NextResponse.json({ error: 'Unsupported MLS source.' }, { status: 400 });
  }
  if (!/^[A-Za-z0-9-]{1,40}$/.test(listingNumber)) {
    return NextResponse.json({ error: 'A valid listingNumber is required.' }, { status: 400 });
  }
  if (!process.env.MLSGRID_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MLS Grid access token is not configured.' }, { status: 503 });
  }

  const sources = requestedSource === 'flinthills' ? ['flinthills', 'sunflower'] : ['sunflower', 'flinthills'];
  const prefixes: Record<string, string> = { flinthills: 'FHR', sunflower: 'SUN' };
  const serviceCities = new Set([
    'st marys', 'saint marys', 'wamego', 'manhattan', 'topeka', 'st george', 'saint george',
    'rossville', 'silver lake', 'auburn', 'willard', 'berryton', 'dover', 'elmont', 'pauline',
    'tecumseh', 'wakarusa', 'leonardville', 'ogden', 'randolph', 'riley', 'fort riley', 'keats',
    'zeandale', 'belvue', 'bellevue', 'emmett', 'havensville', 'louisville', 'olsburg', 'onaga',
    'westmoreland', 'wheaton', 'blaine', 'duluth', 'flush', 'fostoria', 'st clere', 'saint clere',
    'alma', 'paxico', 'maple hill', 'eskridge', 'harveyville', 'mcfarland', 'junction city',
    'mayetta', 'holton'
  ]);
  const checks: Array<{ source: string; queriedListingId: string; found: boolean; error?: string; status?: number }> = [];

  for (const source of sources) {
    const prefix = prefixes[source];
    const normalizedId = listingNumber.toUpperCase().startsWith(prefix) ? listingNumber.toUpperCase() : prefix + listingNumber;
    const filter = `OriginatingSystemName eq '${source}' and ListingId eq '${normalizedId}'`;
    const endpoint = 'https://api.mlsgrid.com/v2/Property?' + new URLSearchParams({
      '$filter': filter,
      '$top': '2'
    }).toString();
    try {
      // Read-only query. No Blob, sync-state, cache, or public-data writes.
      const page = await fetchMLSGridPage(source, endpoint, false);
      const record = page.value?.[0];
      checks.push({ source, queriedListingId: normalizedId, found: Boolean(record) });
      if (!record) continue;
      const city = String(record.City || '');
      const normalizedCity = city.toLowerCase().replace(/[.'’,-]/g, ' ').replace(/\\s+/g, ' ').trim();
      return NextResponse.json({
        ok: true,
        found: true,
        requestedSource,
        matchedSource: source,
        listingNumber,
        queriedListingId: normalizedId,
        listingId: String(record.ListingId || ''),
        listingKey: String(record.ListingKey || ''),
        originatingSystemName: String(record.OriginatingSystemName || ''),
        city,
        inServiceArea: serviceCities.has(normalizedCity),
        standardStatus: String(record.StandardStatus || ''),
        canView: record.MlgCanView === true,
        modificationTimestamp: String(record.ModificationTimestamp || ''),
        officeNamePresent: Boolean(record.ListOfficeName),
        checks
      });
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      checks.push({ source, queriedListingId: normalizedId, found: false, status: status || 500, error: (error instanceof Error ? error.message : String(error)).slice(0, 500) });
    }
  }

  return NextResponse.json({ ok: checks.every(check => !check.error), found: false, listingNumber, checks });
}
