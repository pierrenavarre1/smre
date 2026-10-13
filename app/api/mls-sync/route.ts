import { NextRequest, NextResponse } from 'next/server';
import { runIncrementalMLSGridSync } from '../../lib/mls-sync-incremental';

// Each invocation performs one bounded sync step. Progress is persisted in Blob,
// so a timeout or deployment does not force a full restart.
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
    const result = await runIncrementalMLSGridSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('MLS sync failed:', error);
    return NextResponse.json({ error: 'MLS sync failed.' }, { status: 500 });
  }
}
