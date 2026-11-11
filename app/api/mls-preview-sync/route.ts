import { NextRequest, NextResponse } from 'next/server';
import { runIncrementalMLSGridSync } from '../../lib/mls-sync-incremental';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const cronAuthorized = Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
  const protectedPreview = process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'mls-incremental-sync-preview';
  return cronAuthorized || protectedPreview;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'This manual sync endpoint is preview-only.' }, { status: 403 });
  }
  if (!process.env.MLSGRID_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MLS Grid access token is not configured.' }, { status: 503 });
  }

  try {
    const steps = [];
    let result: Awaited<ReturnType<typeof runIncrementalMLSGridSync>> | undefined;
    for (let i = 0; i < 4; i++) {
      result = await runIncrementalMLSGridSync();
      steps.push(result);
      if (result.status !== 'metadata-page-saved' && result.status !== 'metadata-complete') break;
    }
    return NextResponse.json({ ok: true, result, steps, storageNamespace: 'preview/mls-incremental-sync-preview' });
  } catch (error) {
    console.error('Preview MLS sync failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Preview MLS sync failed.' }, { status: 500 });
  }
}
