import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';

function isMLSGridCdnUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cdn-stmarys.mlsgrid.com';
  } catch {
    return false;
  }
}

const DEMO_MODE = Boolean(process.env.MLSGRID_DEMO_ACCESS_TOKEN);
const inFlight = new Map<string, Promise<{ bytes: ArrayBuffer; contentType: string }>>();
let blobUnavailableUntil = 0;
const BLOB_FAILURE_COOLDOWN_MS = 5 * 60_000;

// Deduplicate simultaneous reads for the same private Blob object.
const blobReadInFlight = new Map<string, Promise<{ bytes: ArrayBuffer; contentType: string } | null>>();

async function readStoredImage(pathname: string) {
  const existing = blobReadInFlight.get(pathname);
  if (existing) return existing;
  const promise = (async () => {
    const result = await get(pathname, { access: 'private', useCache: true });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return {
      bytes: await new Response(result.stream).arrayBuffer(),
      contentType: result.blob.contentType || 'image/jpeg'
    };
  })();
  blobReadInFlight.set(pathname, promise);
  try {
    return await promise;
  } finally {
    blobReadInFlight.delete(pathname);
  }
}

async function downloadMedia(rawUrl: string) {
  const existing = inFlight.get(rawUrl);
  if (existing) return existing;

  const promise = (async () => {
    const token = process.env.MLSGRID_ACCESS_TOKEN;
    if (!token) throw new Error('MLS Grid access token is not configured.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(rawUrl, {
        headers: {
          Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*',
          'User-Agent': token
        },
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error('MLS image source returned ' + response.status + ' ' + response.statusText);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      if (!contentType.toLowerCase().startsWith('image/')) {
        throw new Error('MLS media URL returned non-image content.');
      }

      return { bytes: await response.arrayBuffer(), contentType };
    } finally {
      clearTimeout(timeout);
    }
  })();

  inFlight.set(rawUrl, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(rawUrl);
  }
}

function unavailableResponse() {
  return new Response('Listing image storage is temporarily unavailable.', {
    status: 503,
    headers: { 'Cache-Control': 'no-store' }
  });
}

function imageResponse(bytes: ArrayBuffer, contentType: string) {
  return new Response(bytes, {
    headers: {
      'Content-Type': contentType,
      // Keep photos at the edge so each page view does not query private Blob storage.
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
      'Vercel-CDN-Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
      'CDN-Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) return new Response('Missing image URL.', { status: 400 });

  // MLS Grid's CDN URLs are stable and intended for direct delivery. Fetch only
  // this exact allowlisted host; never use this route as a general URL proxy.
  if (isMLSGridCdnUrl(rawUrl)) {
    try {
      const response = await fetch(rawUrl, {
        headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*' },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok || !response.body) {
        console.error('MLS Grid CDN image request failed', { status: response.status });
        return new Response('Unable to retrieve listing image.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      if (!contentType.toLowerCase().startsWith('image/')) {
        return new Response('Invalid image content.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
      }
      return imageResponse(await response.arrayBuffer(), contentType);
    } catch (error) {
      console.error('MLS Grid CDN image fetch failed', error instanceof Error ? error.message : error);
      return new Response('Unable to retrieve listing image.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  const storedPrefix = DEMO_MODE ? 'smre-demo-blob:' : 'smre-blob:';
  const storedKey = rawUrl.startsWith(storedPrefix) ? rawUrl.slice(storedPrefix.length) : '';
  if (storedKey && !/^[a-zA-Z0-9_-]{8,128}$/.test(storedKey)) {
    return new Response('Invalid stored image key.', { status: 400 });
  }

  // MLS Grid signed URLs are single-use and expire after one hour. Public page requests must only serve locally stored image copies; stale raw URLs must be refreshed by the sync job.
  // Signed MLS media URLs must never be fetched on page render. The sync job
  // stores those bytes and pages use the smre-blob key; CDN URLs are handled above.
  if (!storedKey) return unavailableResponse();

  const key = storedKey;
  const pathname = (DEMO_MODE ? 'mls/demo/images/' : 'mls/images/') + key + '.image';

  // Try existing stored bytes first, including during a storage-write cooldown.
  try {
    const cached = await readStoredImage(pathname);
    if (cached) return imageResponse(cached.bytes, cached.contentType);
    if (storedKey) return unavailableResponse();
  } catch (error) {
    blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
    console.error('MLS image storage read failed:', error instanceof Error ? error.message : error);
    return unavailableResponse();
  }

  // Don't keep retrying signed single-use MLS URLs when storage is failing.
  if (Date.now() < blobUnavailableUntil) return unavailableResponse();

  try {
    const image = await downloadMedia(rawUrl);
    try {
      await put(pathname, image.bytes, {
        access: 'private',
        allowOverwrite: true,
        cacheControlMaxAge: 86400,
        contentType: image.contentType
      });
    } catch (error) {
      blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
      console.error('MLS image cache write failed:', error instanceof Error ? error.message : error);
      // Return the photo to the current visitor even if persistent caching is temporarily down.
      return imageResponse(image.bytes, image.contentType);
    }

    return imageResponse(image.bytes, image.contentType);
  } catch (error) {
    console.error('MLS image fetch failed:', error instanceof Error ? error.message : error);
    return new Response('Unable to retrieve image.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
