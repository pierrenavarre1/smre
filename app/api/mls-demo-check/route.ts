import { NextResponse } from 'next/server';
import { fetchMLSGridPage, fetchMLSGridLiveListing } from '../../lib/mlsgrid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  for (const source of ['sunflower', 'flinthills']) {
    try {
      const url = 'https://api-demo.mlsgrid.com/v2/Property?' + new URLSearchParams({
        '$filter': "OriginatingSystemName eq '" + source + "'",
        '$select': 'ListingId,OriginatingSystemName',
        '$top': '5'
      }).toString();

      const page = await fetchMLSGridPage(source, url);
      const records = page.value || [];
      const sampleIds = records
        .map(record => String(record.ListingId || ''))
        .filter(Boolean)
        .slice(0, 3);

      let mediaTest: Record<string, unknown> | null = null;
      if (sampleIds[0]) {
        try {
          const listing = await fetchMLSGridLiveListing(source + ':' + sampleIds[0]);
          const photos = listing?.Media || [];
          let imageFetch: Record<string, unknown> | null = null;
          if (photos[0]?.MediaURL) {
            try {
              const imageResponse = await fetch(photos[0].MediaURL, { method: 'GET', headers: { Accept: 'image/*' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
              imageFetch = { status: imageResponse.status, contentType: imageResponse.headers.get('content-type'), contentLength: imageResponse.headers.get('content-length') };
              await imageResponse.body?.cancel().catch(() => undefined);
            } catch (imageError) {
              imageFetch = { error: imageError instanceof Error ? imageError.message : String(imageError) };
            }
          }
          mediaTest = {
            listingId: sampleIds[0],
            returned: Boolean(listing),
            photoCount: photos.length,
            mediaHosts: [...new Set(photos.map(photo => {
              try { return new URL(photo.MediaURL).hostname; } catch { return 'invalid-url'; }
            }))],
            imageFetch
          };
        } catch (error) {
          mediaTest = { listingId: sampleIds[0], error: error instanceof Error ? error.message : String(error) };
        }
      }

      results[source] = { recordCount: records.length, sampleIds, mediaTest };
    } catch (error) {
      results[source] = { error: error instanceof Error ? error.message : String(error) };
    }
  }

  return NextResponse.json({ environment: process.env.VERCEL_ENV, results });
}
