import { get, put } from '@vercel/blob';
import type { RESOProperty } from './mock-properties';

const LISTINGS_PATH = 'mls/listings.json';
let memoryCache: { listings: RESOProperty[]; expiresAt: number } | null = null;
const MEMORY_CACHE_MS = 30_000;

export async function readMLSCache(): Promise<RESOProperty[]> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) return memoryCache.listings;

  const result = await get(LISTINGS_PATH, { access: 'private', useCache: true });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text);
  const listings = Array.isArray(parsed?.listings) ? parsed.listings : [];
  memoryCache = { listings, expiresAt: Date.now() + MEMORY_CACHE_MS };
  return listings;
}

export async function writeMLSCache(listings: RESOProperty[]) {
  memoryCache = { listings, expiresAt: Date.now() + MEMORY_CACHE_MS };
  await put(LISTINGS_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), listings }), {
    access: 'private',
    allowOverwrite: true,
    cacheControlMaxAge: 300,
    contentType: 'application/json'
  });
}
