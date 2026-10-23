import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';

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
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) return new Response('Missing image URL.', { status: 400 });

  const storedKey = rawUrl.startsWith('smre-blob:') ? rawUrl.slice('smre-blob:'.length) : '';
  if (storedKey && !/^[a-zA-Z0-9_-]{8,128}$/.test(storedKey)) {
    return new Response('Invalid stored image key.', { status: 400 });
  }

  // Detail pages can supply freshly issued MLS media URLs. Accept only HTTPS
  // URLs from known MLS/CDN hosts, then cache the downloaded bytes by URL hash.
  // Stored smre-blob keys never trigger a live download if their Blob is missing.
  if (!storedKey) {
    let url: URL;
    try { url = new URL(rawUrl); } catch { return new Response('Invalid image URL.', { status: 400 }); }
    if (url.protocol !== 'https:' || !allowedMediaHost(url.hostname)) {
      return new Response('Image host is not allowed.', { status: 403 });
    }
  }

  const key = storedKey || createHash('sha256').update(rawUrl).digest('hex');
  const pathname = 'mls/images/' + key + '.image';

  // Try existing stored bytes first, including during a storage-write cooldown.
  try {
    const cached = await readStoredImage(pathname);
    if (cached) return imageResponse(cached.bytes, cached.contentType);
    if (storedKey) return unavailableResponse();
  } catch (error) {
    blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
    console.error('MLS image storage read failed:', error instanceof Error ? error.message : error);
    // A raw, freshly issued MLS URL can still be served even if Blob storage is
    // unavailable. Only a stored key lacks a source URL to fall back to.
    if (storedKey) return unavailableResponse();
  }

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
