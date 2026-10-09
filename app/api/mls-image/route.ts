import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';

function allowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === 'media.mlsgrid.com' || host.endsWith('.mlsgrid.com') || host === 's3.amazonaws.com' || host.endsWith('.s3.amazonaws.com') || host.endsWith('.amazonaws.com');
}

let mediaQueue: Promise<void> = Promise.resolve();
let lastMediaDownloadAt = 0;
const MEDIA_MIN_INTERVAL_MS = 650;
const inFlight = new Map<string, Promise<{ bytes: ArrayBuffer; contentType: string }>>();

function queueMediaDownload(task: () => Promise<{ bytes: ArrayBuffer; contentType: string }>) {
  const run = mediaQueue.then(async () => {
    const wait = Math.max(0, MEDIA_MIN_INTERVAL_MS - (Date.now() - lastMediaDownloadAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastMediaDownloadAt = Date.now();
    return task();
  });
  mediaQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function downloadMedia(rawUrl: string) {
  const existing = inFlight.get(rawUrl);
  if (existing) return existing;

  const promise = queueMediaDownload(async () => {
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
  });

  inFlight.set(rawUrl, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(rawUrl);
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) return new Response('Missing image URL.', { status: 400 });

  let url: URL;
  try { url = new URL(rawUrl); } catch { return new Response('Invalid image URL.', { status: 400 }); }

  if (url.protocol !== 'https:' || !allowedMediaHost(url.hostname)) {
    return new Response('Image host is not allowed.', { status: 403 });
  }

  const key = createHash('sha256').update(rawUrl).digest('hex');
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
  } catch {}

  try {
    const { bytes, contentType } = await downloadMedia(rawUrl);
    try {
      await put(pathname, bytes, {
        access: 'private',
        allowOverwrite: true,
        cacheControlMaxAge: 31536000,
        contentType
      });
    } catch (error) {
      console.error('MLS image cache write failed:', error);
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('MLS image fetch failed:', error instanceof Error ? error.message : error);
    return new Response('Unable to retrieve image.', { status: 502 });
  }
}
