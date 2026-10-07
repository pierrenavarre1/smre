import { get, put } from '@vercel/blob';
import type { RESOProperty } from './mock-properties';

const LISTINGS_PATH = 'mls/listings.json';

export async function readMLSCache(): Promise<RESOProperty[]> {
  const result = await get(LISTINGS_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text);
  return Array.isArray(parsed?.listings) ? parsed.listings : [];
}

export async function writeMLSCache(listings: RESOProperty[]) {
  await put(LISTINGS_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), listings }), {
    access: 'private',
    allowOverwrite: true,
    cacheControlMaxAge: 300,
    contentType: 'application/json'
  });
}
