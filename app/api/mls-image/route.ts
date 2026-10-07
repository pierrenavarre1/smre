import { NextRequest } from 'next/server';

function allowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === 's3.amazonaws.com' ||
    host.endsWith('.s3.amazonaws.com') ||
    host.endsWith('.amazonaws.com')
  );
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing image URL.', { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return new Response('Invalid image URL.', { status: 400 });
  }

  if (url.protocol !== 'https:' || !allowedMediaHost(url.hostname)) {
    return new Response('Image host is not allowed.', { status: 403 });
  }

  const response = await fetch(url, {
    headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*' },
    next: { revalidate: 86400 }
  });

  if (!response.ok || !response.body) {
    return new Response('Unable to retrieve image.', { status: 502 });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
    }
  });
}
