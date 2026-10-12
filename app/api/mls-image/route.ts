import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';

function allowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === 'media.mlsgrid.com' || host.endsWith('.mlsgrid.com') || host === 's3.amazonaws.com' || host.endsWith('.s3.amazonaws.com') || host.endsWith('.amazonaws.com');
}

const inFlight = new Map<string, Promise<{ bytes: ArrayBuffer; contentType: string }>>();
let blobUnavailableUntil = 0;
const BLOB_FAILURE_COOLDOWN_MS = 30 * 60_000;

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

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) return new Response('Missing image URL.', { status: 400 });

  const storedKey = rawUrl.startsWith('smre-blob:') ? rawUrl.slice('smre-blob:'.length) : '';
  if (!storedKey) {
    let url: URL;
    try { url = new URL(rawUrl); } catch { return new Response('Invalid image URL.', { status: 400 }); }
    if (url.protocol !== 'https:' || !allowedMediaHost(url.hostname)) {
      return new Response('Image host is not allowed.', { status: 403 });
    }
  }

  // Once Blob has failed, do not keep consuming single-use MLS media URLs on
  // every image request when the downloaded copy cannot be saved permanently.
  if (Date.now() < blobUnavailableUntil) return unavailableResponse();

  const key = storedKey || createHash('sha256').update(rawUrl).digest('hex');
  const pathname = 'mls/images/' + key + '.image';

  try {
    const cached = await get(pathname, { access: 'private', useCache: true });
    if (cached?.statusCode === 200 && cached.stream) {
      return new Response(cached.stream, {
        headers: {
          'Content-Type': cached.blob.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    if (storedKey) {
      blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
      return unavailableResponse();
    }
  } catch (error) {
    blobUnavailableUntil = Date.now() + BLOB_FAILURE_COOLDOWN_MS;
    console.error('MLS image storage read failed:', error instanceof Error ? error.message : error);
    return unavailableResponse();
  }

  try {
    // MLS Grid media URLs are single-use and time-limited. Download only when
    // storage is healthy so the image can be retained as a local copy.
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
      return unavailableResponse();
    }

    return new Response(image.bytes, {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('MLS image fetch failed:', error instanceof Error ? error.message : error);
    return new Response('Unable to retrieve image.', { status: 502 });
  }
}
