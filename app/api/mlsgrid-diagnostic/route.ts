import { NextResponse } from 'next/server';
import { fetchMLSGridPage } from '../../lib/mlsgrid';

// Temporary, sanitized Preview diagnostic. Do not return listing details or credentials.
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in Production.' }, { status: 404 });
  }

  const sources = ['sunflower', 'flinthills'];
  const results = [];

  for (const source of sources) {
    try {
      const query = new URLSearchParams({
        '$filter': "OriginatingSystemName eq '" + source + "' and MlgCanView eq true and StandardStatus in ('Active','Pending')",
        '$expand': 'Media',
        '$top': '5'
      });
      const page = await fetchMLSGridPage(source, 'https://api-demo.mlsgrid.com/v2/Property?' + query.toString(), true);
      const records = page.value || [];
      const mediaItems = records.flatMap((record: any) => Array.isArray(record.Media) ? record.Media : []);
      const hosts = [...new Set(mediaItems
        .map((item: any) => {
          try { return new URL(String(item.MediaURL || '')).hostname; } catch { return ''; }
        })
        .filter(Boolean)
      )];
      const sampleUrl = mediaItems.find((item: any) => item.MediaURL)?.MediaURL;
      let imageCheck: { status: number; contentType: string } | null = null;
      if (sampleUrl) {
        const imageResponse = await fetch(sampleUrl, { signal: AbortSignal.timeout(10000) });
        imageCheck = {
          status: imageResponse.status,
          contentType: imageResponse.headers.get('content-type') || ''
        };
        await imageResponse.body?.cancel().catch(() => undefined);
      }
      results.push({ source, ok: true, recordsReturned: records.length, mediaHostnames: hosts, imageCheck });
    } catch (error) {
      results.push({ source, ok: false, error: error instanceof Error ? error.message.slice(0, 180) : 'Unknown error' });
    }
  }

  return NextResponse.json({
    environment: process.env.VERCEL_ENV || 'local',
    demoTokenConfigured: Boolean(process.env.MLSGRID_DEMO_ACCESS_TOKEN),
    results
  });
}
