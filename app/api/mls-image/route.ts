import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';
import { fetchFreshMediaForListing } from '../../lib/mlsgrid';

function allowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === 's3.amazonaws.com' ||
    host.endsWith('.s3.amazonaws.com') ||
    host.endsWith('.amazonaws.com') ||
    host.endsWith('.mlsgrid.com')
  );
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

  const imageIdentity = (() => {
    const parts = url.pathname.split('/').filter(Boolean);
    const imagesIndex = parts.findIndex((part) => part.toLowerCase() === 'images');
    if (imagesIndex >= 0 && parts[imagesIndex + 1] && parts[imagesIndex + 2]) {
      return `${parts[imagesIndex + 1]}/${parts[imagesIndex + 2]}`;
    }
    return null;
  })();
  const stablePathname = imageIdentity
    ? 'mls/images/stable-' + createHash('sha256').update(imageIdentity).digest('hex') + '.image'
    : null;

  try {
    const cached = await get(stablePathname || pathname, { access: 'private', useCache: true });
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

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*',
        'User-Agent': 'SMRE-MLS-Image-Cache/1.0'
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal
    });
  } catch (error) {
    console.error('MLS image fetch failed:', error);
    return new Response('Unable to retrieve image.', { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || !response.body) {
    if (imageIdentity) {
      const [listingId, filename] = imageIdentity.split('/');
      const freshListing = { ListingId: url.hostname === 'media.mlsgrid.com' ? (rawUrl.includes('/FHR') ? 'flinthills:' : 'sunflower:') + listingId : '', Media: [] } as any;
      if (freshListing.ListingId) {
        try {
          const freshMedia = await fetchFreshMediaForListing(freshListing);
          const fresh = freshMedia.find((photo) => photo.MediaURL.split('/').pop()?.split('?')[0] === filename);
          if (fresh?.MediaURL && fresh.MediaURL !== rawUrl) {
            const freshResponse = await fetch(fresh.MediaURL, { headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*' }, redirect: 'follow' });
            if (freshResponse.ok && freshResponse.body) {
              const freshType = freshResponse.headers.get('content-type') || 'image/jpeg';
              if (freshType.toLowerCase().startsWith('image/')) {
                const freshBytes = await freshResponse.arrayBuffer();
                try { await put(stablePathname || pathname, freshBytes, { access: 'private', allowOverwrite: true, cacheControlMaxAge: 31536000, contentType: freshType }); } catch {}
                return new Response(freshBytes, { headers: { 'Content-Type': freshType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
              }
            }
          }
        } catch (error) { console.error('MLS image refresh failed:', error); }
      }
    }
    console.error('MLS image source returned', response.status, response.statusText, url.hostname);
    return new Response('Unable to retrieve image.', { status: 502 });
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.toLowerCase().startsWith('image/')) {
    console.error('MLS image source returned non-image content type:', contentType);
    return new Response('MLS media URL did not return an image.', { status: 502 });
  }

  const bytes = await response.arrayBuffer();

  try {
    await put(stablePathname || pathname, bytes, {
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
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
