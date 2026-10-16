import { NextResponse } from 'next/server';
import { normalizeMLSGridProperty, dedupeListings } from '../../lib/mlsgrid';
import { writeMLSCache } from '../../lib/mls-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let lastRunAt = 0;
let inFlight: Promise<unknown> | null = null;
const COOLDOWN_MS = 10 * 60 * 1000;
const SOURCES = ['sunflower', 'flinthills'] as const;

export async function GET() {
  if (!process.env.MLSGRID_DEMO_ACCESS_TOKEN) {
    return NextResponse.json({ ok: false, message: 'Demo token is not configured.' }, { status: 503 });
  }
  if (inFlight) return NextResponse.json(await inFlight);
  if (Date.now() - lastRunAt < COOLDOWN_MS) {
    return NextResponse.json({ ok: false, status: 'cooldown', message: 'Demo sync was recently run. Wait before retrying.' }, { status: 429 });
  }

  inFlight = (async () => {
    const all: ReturnType<typeof normalizeMLSGridProperty>[] = [];
    const errors: string[] = [];
    for (const source of SOURCES) {
      try {
        const apiUrl = 'https://api-demo.mlsgrid.com/v2/Property?' + new URLSearchParams({
          '$filter': "OriginatingSystemName eq '" + source + "' and MlgCanView eq true and StandardStatus in ('Active','Pending')",
          '$expand': 'Media',
          '$top': '100'
        }).toString();
        const response = await fetch(apiUrl, {
          headers: { Authorization: 'Bearer ' + process.env.MLSGRID_DEMO_ACCESS_TOKEN, Accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(20000)
        });
        if (!response.ok) {
          errors.push(source + ': API returned HTTP ' + response.status);
          continue;
        }
        const payload = await response.json();
        const records = Array.isArray(payload?.value) ? payload.value : [];
        for (const record of records) {
          const photos = Array.isArray(record.Media) ? record.Media.filter((m: any) =>
            typeof m?.MediaURL === 'string' && m.MediaURL &&
            (() => { try { const u = new URL(m.MediaURL); return u.protocol === 'https:' && u.hostname === 'cdn-stmarys.mlsgrid.com'; } catch { return false; } })()
          ) : [];
          const preferred = photos.find((m: any) => m.PreferredPhoto === true || String(m.PreferredPhotoYN).toLowerCase() === 'true') || photos[0];
          record.Media = preferred ? [preferred] : [];
          all.push(normalizeMLSGridProperty(record, source));
        }
      } catch (error) {
        errors.push(source + ': ' + (error instanceof Error ? error.message : 'request failed'));
      }
    }

    if (!all.length) {
      lastRunAt = Date.now();
      return { ok: false, status: 'no-listings', listings: 0, errors, message: 'No Demo listings were loaded; the isolated cache was not changed.' };
    }
    const listings = dedupeListings(all);
    await writeMLSCache(listings);
    lastRunAt = Date.now();
    return {
      ok: errors.length === 0,
      status: 'demo-cache-populated',
      listings: listings.length,
      withCdnPhoto: listings.filter(p => p.Media.some(m => m.MediaURL.startsWith('https://cdn-stmarys.mlsgrid.com/'))).length,
      errors,
      message: 'Demo listing cache updated in isolated mls/demo paths. Production cache was not touched.'
    };
  })();

  try {
    return NextResponse.json(await inFlight);
  } catch {
    lastRunAt = Date.now();
    return NextResponse.json({ ok: false, message: 'Demo sync failed unexpectedly. No token or credentials are returned.' }, { status: 502 });
  } finally {
    inFlight = null;
  }
}
