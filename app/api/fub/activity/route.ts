import { NextRequest, NextResponse } from 'next/server';
import { decryptFubPersonId, FUB_IDENTITY_COOKIE } from '../../../lib/fub-identity';

export const runtime = 'nodejs';

function cleanString(value: unknown, max = 240): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, max);
  return text || undefined;
}

function cleanNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin) {
      const requestOrigin = new URL(request.url).origin;
      if (origin !== requestOrigin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const personId = decryptFubPersonId(request.cookies.get(FUB_IDENTITY_COOKIE)?.value);
    // Do not create anonymous contacts from browsing activity. Only send activity
    // after a person has explicitly submitted a form and FUB returned their ID.
    if (!personId) return new NextResponse(null, { status: 204 });

    const input = await request.json();
    const type = input?.type;
    if (type !== 'Viewed Property' && type !== 'Property Search') {
      return NextResponse.json({ error: 'Unsupported activity type' }, { status: 400 });
    }

    const apiKey = process.env.FUB_API_KEY;
    const systemKey = process.env.FUB_SYSTEM_KEY;
    if (!apiKey || !systemKey) return NextResponse.json({ error: 'FUB is not configured' }, { status: 503 });

    const sourceUrl = cleanString(input?.url, 1000) || cleanString(input?.property?.url, 1000) || 'https://www.smre.info';
    const event: Record<string, unknown> = {
      source: 'smre.info',
      system: 'SMRE Website',
      type,
      person: { id: personId },
      sourceUrl,
      occurredAt: new Date().toISOString(),
    };

    if (type === 'Viewed Property') {
      const p = input?.property || {};
      const street = cleanString(p.street);
      const city = cleanString(p.city, 120);
      const state = cleanString(p.state, 2) || 'KS';
      const url = cleanString(p.url, 1000);
      if (!street || !city || !url) return NextResponse.json({ error: 'Property address and URL are required' }, { status: 400 });
      event.property = {
        street, city, state, url,
        ...(cleanString(p.code, 20) ? { code: cleanString(p.code, 20) } : {}),
        ...(cleanString(p.mlsNumber, 60) ? { mlsNumber: cleanString(p.mlsNumber, 60) } : {}),
        ...(cleanNumber(p.price) !== undefined ? { price: cleanNumber(p.price) } : {}),
      };
      event.message = `Viewed ${street}, ${city}, ${state}${p.mlsNumber ? ` · MLS #${cleanString(p.mlsNumber, 60)}` : ''}`;
    } else {
      const p = input?.propertySearch || {};
      const propertySearch = {
        ...(cleanString(p.city, 120) ? { city: cleanString(p.city, 120) } : {}),
        ...(cleanString(p.propertyType, 120) ? { propertyType: cleanString(p.propertyType, 120) } : {}),
        ...(cleanNumber(p.minPrice) !== undefined ? { minPrice: cleanNumber(p.minPrice) } : {}),
        ...(cleanNumber(p.maxPrice) !== undefined ? { maxPrice: cleanNumber(p.maxPrice) } : {}),
        ...(cleanNumber(p.beds) !== undefined ? { bedrooms: cleanNumber(p.beds) } : {}),
        ...(cleanNumber(p.baths) !== undefined ? { bathrooms: cleanNumber(p.baths) } : {}),
      };
      const criteria = cleanString(p.criteria, 500);
      event.propertySearch = propertySearch;
      event.message = criteria ? `Property search: ${criteria}` : 'Property search submitted on SMRE website';
    }

    const response = await fetch('https://api.followupboss.com/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-System': 'SMRE Website',
        'X-System-Key': systemKey,
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(event),
      cache: 'no-store',
    });

    if (response.status === 204) return new NextResponse(null, { status: 204 });
    if (!response.ok) {
      const detail = await response.text();
      console.error('FUB activity event failed', response.status, detail.slice(0, 500));
      return NextResponse.json({ error: 'Unable to record activity' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, status: response.status });
  } catch (error) {
    console.error('FUB activity error', error);
    return NextResponse.json({ error: 'Unable to record activity' }, { status: 400 });
  }
}
