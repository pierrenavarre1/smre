import { NextRequest, NextResponse } from 'next/server';
import { fetchMLSGridListings } from '../../lib/mlsgrid';
import { writeMLSCache } from '../../lib/mls-store';

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('authorization') === 'Bearer ' + cronSecret) return true;
  return request.headers.get('user-agent')?.startsWith('vercel-cron/') === true;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.MLSGRID_ACCESS_TOKEN) return NextResponse.json({ error: 'MLS Grid access token is not configured.' }, { status: 503 });

  try {
    const listings = await fetchMLSGridListings();
    await writeMLSCache(listings);
    return NextResponse.json({ ok: true, count: listings.length, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('MLS sync failed:', error);
    return NextResponse.json({ error: 'MLS sync failed.' }, { status: 500 });
  }
}
