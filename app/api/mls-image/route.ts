import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { get, put } from '@vercel/blob';

function allowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === 's3.amazonaws.com' || host.endsWith('.s3.amazonaws.com') || host.endsWith('.amazonaws.com');
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
  const pathname = 'mls/images/' + key + '.jpg';

  try {
    const cached = await get(pathname, { access: 'private' });
    if (cached?.statusCode === 200 && cached.stream) {
      return new Response(cached.stream, {
        headers: { 'Content-Type': cached.blob.contentType || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }
      });
    }
  } catch {}

  const response = await fetch(url, {
    headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*' },
    cache: 'no-store'
  });
  if (!response.ok || !response.body) return new Response('Unable to retrieve image.', { status: 502 });

  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  try {
    await put(pathname, bytes, {
      access: 'private',
      allowOverwrite: true,
      cacheControlMaxAge: 86400,
      contentType
    });
  } catch (error) {
    console.error('MLS image cache write failed:', error);
  }

  return new Response(bytes, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' }
  });
}
