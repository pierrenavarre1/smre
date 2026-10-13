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

// Keep private Blob lookups from stampeding when many cards request photos together.
const blobReadInFlight = new Map<string, Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null>>();

async function readStoredImage(pathname: string) {
  const existing = blobReadInFlight.get(pathname);
  if (existing) return existing;
  const promise = (async () => {
    const result = await get(pathname, { access: 'private', useCache: true });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return { stream: result.stream as ReadableStream<Uint8Array>, contentType: result.blob.contentType || 'image/jpeg' };
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
        // Do not retry signed MLS URLs that have expired or already been consumed.
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

function imageResponse(stream: ReadableStream<Uint8Array>, contentType: string) {
  return new Response(stream, {
    headers: {
      'Content-Type': contentType,
      // Cache at the edge/browser, not by repeatedly asking Blob for the same photo.
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
  if (!storedKey) {
    let url: URL;
    try { url = new URL(rawUrl); } catch { return new Response('Invalid image URL.', { status: 400 }); }
    if (url.protocol !== 'https:' || !allowedMediaHost(url.hostname)) {
      return new Response('Image host is not allowed.', { status: 403 });
    }
  }

  const key = storedKey || createHash('sha256').update(rawUrl).digest('hex');
  const pathname = 'mls/images/' + key + '.image';

  // Read from storage even during the write-failure cooldown: existing images may still be healthy.
  try {
    const cached = await readStoredImage(pathname);
    if (cached) return imageResponse(cached.stream, cached.contentType);
    if (storedKey) return unavailableResponse();
  } catch (error) {
    blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
    console.error('MLS image storage read failed:', error instanceof Error ? error.message : error);
    return unavailableResponse();
  }

  if (Date.now() < blobUnavailableUntil) return unavailableResponse();

  try {
    // Signed MLS media URLs can expire. The sync endpoint should normally persist
    // a stable smre-blob key; this path is a fallback for still-valid source URLs.
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
      return new Response(image.bytes, {
        headers: {
          'Content-Type': image.contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    return new Response(image.bytes, {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'Vercel-CDN-Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('MLS image fetch failed:', error instanceof Error ? error.message : error);
    return new Response('Unable to retrieve image.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
