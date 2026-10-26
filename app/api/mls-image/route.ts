import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';
import { getListing } from '../../lib/listings';

function allowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === 'media.mlsgrid.com' || host.endsWith('.mlsgrid.com') || host === 's3.amazonaws.com' || host.endsWith('.s3.amazonaws.com') || host.endsWith('.amazonaws.com');
}

const inFlight = new Map<string, Promise<{ bytes: ArrayBuffer; contentType: string }>>();
let blobUnavailableUntil = 0;
const BLOB_FAILURE_COOLDOWN_MS = 5 * 60_000;

// MLS Grid throttles photo downloads when gallery images request concurrently.
// Serialize downloads within each function instance and back off on HTTP 429.
const MIN_MEDIA_REQUEST_INTERVAL_MS = 1500;
let lastMediaRequestAt = 0;
let mediaRequestQueue: Promise<void> = Promise.resolve();

async function waitForMediaRequestSlot() {
  const slot = mediaRequestQueue.then(async () => {
    const wait = Math.max(0, MIN_MEDIA_REQUEST_INTERVAL_MS - (Date.now() - lastMediaRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastMediaRequestAt = Date.now();
  });
  mediaRequestQueue = slot.catch(() => undefined);
  await slot;
}

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

    for (let attempt = 0; attempt < 4; attempt++) {
      await waitForMediaRequestSlot();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
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

        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get('retry-after') || '');
          const backoffMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 2000 * (attempt + 1);
          await response.body?.cancel().catch(() => undefined);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
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
    }
    throw new Error('MLS image source remained rate-limited after retries.');
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
  const listingId = request.nextUrl.searchParams.get('listingId');
  const requestedIndex = Number(request.nextUrl.searchParams.get('index') || '0');
  let rawUrl = request.nextUrl.searchParams.get('url') || '';
  let stablePathname = '';

  // Prefer a stable cache key for each listing/photo. MLS Grid URLs can be
  // short-lived and signed, so caching by URL alone causes repeat downloads
  // when the signature changes and can trigger upstream 429 responses.
  if (!rawUrl && listingId && Number.isInteger(requestedIndex) && requestedIndex >= 0) {
    try {
      const listing = await getListing(listingId);
      const photos = listing?.Media?.filter(photo => photo.MediaCategory === 'Photo' && photo.MediaURL) || [];
      const current = photos[requestedIndex];
      if (current) {
        if (current.MediaURL) rawUrl = current.MediaURL;
        const stableKey = createHash('sha256').update(listingId + ':' + current.MediaKey).digest('hex');
        stablePathname = 'mls/images/' + stableKey + '.image';

        // Stored photos are independent of the temporary signed URL. Return the
        // stable cached copy first, avoiding an upstream media request entirely.
        try {
          const cached = await readStoredImage(stablePathname);
          if (cached) return imageResponse(cached.bytes, cached.contentType);
        } catch (error) {
          console.error('MLS stable image cache read failed:', error instanceof Error ? error.message : error);
        }
      }
    } catch (error) {
      console.error('Unable to resolve current MLS photo:', error instanceof Error ? error.message : error);
    }
  }

  if (!rawUrl) return new Response('Missing image URL.', { status: 400 });
  const storedKey = rawUrl.startsWith('smre-blob:') ? rawUrl.slice('smre-blob:'.length) : '';
  if (storedKey && !/^[a-zA-Z0-9_-]{8,128}$/.test(storedKey)) {
    return new Response('Invalid stored image key.', { status: 400 });
  }

  if (!storedKey) {
    let url: URL;
    try { url = new URL(rawUrl); } catch { return new Response('Invalid image URL.', { status: 400 }); }
    if (url.protocol !== 'https:' || !allowedMediaHost(url.hostname)) {
      return new Response('Image host is not allowed.', { status: 403 });
    }
  }

  // For old sync-generated Blob keys, keep the existing stable-key behavior.
  const key = storedKey || (stablePathname
    ? stablePathname.slice('mls/images/'.length, -'.image'.length)
    : createHash('sha256').update(rawUrl).digest('hex'));
  const pathname = 'mls/images/' + key + '.image';

  try {
    const cached = await readStoredImage(pathname);
    if (cached) return imageResponse(cached.bytes, cached.contentType);
    if (storedKey) return unavailableResponse();
  } catch (error) {
    blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
    console.error('MLS image storage read failed:', error instanceof Error ? error.message : error);
    if (storedKey) return unavailableResponse();
  }

  try {
    const image = await downloadMedia(rawUrl);
    try {
      await put(pathname, image.bytes, {
        access: 'private',
        allowOverwrite: true,
        cacheControlMaxAge: 31536000,
        contentType: image.contentType
      });
    } catch (error) {
      blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
      console.error('MLS image cache write failed:', error instanceof Error ? error.message : error);
      return imageResponse(image.bytes, image.contentType);
    }
    return imageResponse(image.bytes, image.contentType);
  } catch (error) {
    console.error('MLS image fetch failed:', error instanceof Error ? error.message : error);
    return new Response('Unable to retrieve image.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
