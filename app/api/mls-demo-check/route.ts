import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const token = process.env.MLSGRID_DEMO_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, stage: 'configuration', message: 'Demo token is not configured for this deployment.' }, { status: 503 });
  }

  try {
    const apiUrl = 'https://api-demo.mlsgrid.com/v2/Property?' + new URLSearchParams({
      '$filter': "OriginatingSystemName eq 'sunflower' and MlgCanView eq true and StandardStatus in ('Active','Pending')",
      '$expand': 'Media',
      '$top': '1'
    }).toString();
    const apiResponse = await fetch(apiUrl, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });
    if (!apiResponse.ok) {
      let detail = '';
      try {
        // Return only a short API error explanation; never echo request headers or credentials.
        detail = (await apiResponse.text()).replace(/Bearer\\s+[^\\s"']+/gi, 'Bearer [redacted]').slice(0, 300);
      } catch {}
      return NextResponse.json({
        ok: false, stage: 'demo-api', status: apiResponse.status,
        detail,
        message: 'The Demo API request failed. No access token is included in this report.'
      }, { status: 502 });
    }

    const payload = await apiResponse.json();
    const records = Array.isArray(payload?.value) ? payload.value : [];
    const media = records.flatMap((record: any) => Array.isArray(record?.Media) ? record.Media : []);
    const photo = media.find((item: any) => typeof item?.MediaURL === 'string' && item.MediaURL);
    if (!photo) {
      return NextResponse.json({
        ok: false, stage: 'demo-media', recordsChecked: records.length,
        message: 'The Demo API responded, but this sample did not include a photo URL.'
      }, { status: 200 });
    }

    let photoUrl: URL;
    try { photoUrl = new URL(photo.MediaURL); } catch {
      return NextResponse.json({ ok: false, stage: 'media-url', message: 'The Demo API returned an invalid photo URL.' }, { status: 200 });
    }
    if (photoUrl.protocol !== 'https:' || photoUrl.hostname !== 'cdn-stmarys.mlsgrid.com') {
      return NextResponse.json({
        ok: false, stage: 'cdn-host', host: photoUrl.hostname,
        message: 'The Demo API returned a photo URL that is not on the expected CDN hostname.'
      }, { status: 200 });
    }

    const imageResponse = await fetch(photoUrl.toString(), {
      headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });
    const contentType = imageResponse.headers.get('content-type') || '';
    const isImage = imageResponse.ok && contentType.toLowerCase().startsWith('image/');
    if (imageResponse.body) await imageResponse.body.cancel().catch(() => {});
    return NextResponse.json({
      ok: isImage,
      stage: 'cdn-image',
      host: photoUrl.hostname,
      status: imageResponse.status,
      contentType,
      message: isImage ? 'Demo API returned a CDN URL and the image endpoint responded with an image.' : 'The CDN URL did not return a successful image response.'
    }, { status: isImage ? 200 : 502 });
  } catch (error) {
    return NextResponse.json({
      ok: false, stage: 'request',
      message: error instanceof Error ? error.message : 'Unexpected Demo CDN test error.'
    }, { status: 502 });
  }
}
