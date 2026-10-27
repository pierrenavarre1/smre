import { NextRequest, NextResponse } from 'next/server';
import { runIncrementalMLSGridSync } from '../../lib/mls-sync-incremental';

// Each invocation performs one bounded sync step. Progress is persisted in Blob,
// so a timeout or deployment does not force a full restart.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret && request.headers.get('authorization') === 'Bearer ' + cronSecret);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hasAccessToken = process.env.VERCEL_ENV === 'production'
    ? Boolean(process.env.MLSGRID_ACCESS_TOKEN)
    : Boolean(process.env.MLSGRID_DEMO_ACCESS_TOKEN || (process.env.VERCEL_ENV !== 'preview' && process.env.MLSGRID_ACCESS_TOKEN));
  if (!hasAccessToken) return NextResponse.json({ error: 'MLS Grid access token is not configured for this environment.' }, { status: 503 });

  console.log('MLS sync request received', { userAgent: request.headers.get('user-agent') || '' });
  try {
    const result = await runIncrementalMLSGridSync();
    return NextResponse.json(result);
  } catch (error) {
    console.error('MLS sync failed:', error);
    return NextResponse.json({ error: 'MLS sync failed.' }, { status: 500 });
  }
}
