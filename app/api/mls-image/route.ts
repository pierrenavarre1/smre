import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';
import { fetchMLSGridLiveListing } from '../../lib/mlsgrid';

function allowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === 'media.mlsgrid.com' || host.endsWith('.mlsgrid.com') || host === 's3.amazonaws.com' || host.endsWith('.s3.amazonaws.com') || host.endsWith('.amazonaws.com');
}

const inFlight = new Map<string, Promise<{ bytes: ArrayBuffer; contentType: string }>>();
let blobUnavailableUntil = 0;

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

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) return new Response('Missing image URL.', { status: 400 });
  const listingId = request.nextUrl.searchParams.get('listingId') || '';
  const mediaIndex = Math.max(0, Number.parseInt(request.nextUrl.searchParams.get('index') || '0', 10) || 0);

  const storedKey = rawUrl.startsWith('smre-blob:') ? rawUrl.slice('smre-blob:'.length) : '';
  if (!storedKey) {
    let url: URL;
    try { url = new URL(rawUrl); } catch { return new Response('Invalid image URL.', { status: 400 }); }
    if (url.protocol !== 'https:' || !allowedMediaHost(url.hostname)) {
      return new Response('Image host is not allowed.', { status: 403 });
    }
  }

  const key = storedKey || createHash('sha256').update(rawUrl).digest('hex');
  const pathname = 'mls/images/' + key + '.image';

  if (Date.now() >= blobUnavailableUntil) {
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
    } catch {
      // Avoid repeating a failing Blob lookup for every image in the same warm instance.
      blobUnavailableUntil = Date.now() + 5 * 60_000;
    }
  }

  try {
    let imageUrl = rawUrl;
    if (storedKey) {
      // A stored key cannot be resolved while Blob is unavailable. Ask MLS Grid
      // for a fresh, signed URL for this exact gallery photo instead.
      if (!listingId) return new Response('Stored image unavailable.', { status: 404 });
      const freshListing = await fetchMLSGridLiveListing(listingId);
      const freshPhoto = freshListing?.Media?.[mediaIndex];
      if (!freshPhoto?.MediaURL) return new Response('Stored image unavailable.', { status: 404 });
      imageUrl = freshPhoto.MediaURL;
    }
    let image: { bytes: ArrayBuffer; contentType: string };

    try {
      image = await downloadMedia(imageUrl);
    } catch (firstError) {
      // MLS Grid media URLs expire. Refresh the listing's Media records and
      // retry the same photo index rather than leaving a broken image.
      if (!listingId) throw firstError;
      const freshListing = await fetchMLSGridLiveListing(listingId);
      const freshPhoto = freshListing?.Media?.[mediaIndex];
      if (!freshPhoto?.MediaURL) throw firstError;
      imageUrl = freshPhoto.MediaURL;
      image = await downloadMedia(imageUrl);
    }

    const imageKey = createHash('sha256').update(imageUrl).digest('hex');
    const imagePath = 'mls/images/' + imageKey + '.image';
    try {
      await put(imagePath, image.bytes, {
        access: 'private',
        allowOverwrite: true,
        cacheControlMaxAge: 31536000,
        contentType: image.contentType
      });
    } catch (error) {
      // Still serve the downloaded image when Blob storage is unavailable.
      console.error('MLS image cache write failed:', error);
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
