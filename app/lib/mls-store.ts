import { get, put } from '@vercel/blob';
import type { RESOProperty } from './mock-properties';

const LISTINGS_PATH = 'mls/listings.json';
const LISTINGS_SUMMARY_PATH = 'mls/listings-summary.json';

let memoryCache: { listings: RESOProperty[]; expiresAt: number } | null = null;
let memorySummaryCache: { listings: RESOProperty[]; expiresAt: number } | null = null;
const MEMORY_CACHE_MS = 30_000;

async function readBlob(pathname: string): Promise<RESOProperty[]> {
  const result = await get(pathname, { access: 'private', useCache: true });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text);
  return Array.isArray(parsed?.listings) ? parsed.listings : [];
}

export async function readMLSCache(): Promise<RESOProperty[]> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) return memoryCache.listings;
  const listings = await readBlob(LISTINGS_PATH);
  memoryCache = { listings, expiresAt: Date.now() + MEMORY_CACHE_MS };
  return listings;
}

export async function readMLSSummaryCache(): Promise<RESOProperty[]> {
  if (memorySummaryCache && memorySummaryCache.expiresAt > Date.now()) return memorySummaryCache.listings;
  let listings = await readBlob(LISTINGS_SUMMARY_PATH);
  if (!listings.length) {
    const fullListings = await readBlob(LISTINGS_PATH);
    if (fullListings.length) {
      listings = fullListings.map(({ Media: _media, ...listing }) => ({ ...listing, Media: [] }));
      void put(LISTINGS_SUMMARY_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), listings }), {
        access: 'private',
        allowOverwrite: true,
        cacheControlMaxAge: 300,
        contentType: 'application/json'
      }).catch(() => {});
    }
  }
  memorySummaryCache = { listings, expiresAt: Date.now() + MEMORY_CACHE_MS };
  return listings;
}

export async function writeMLSCache(listings: RESOProperty[]) {
  memoryCache = { listings, expiresAt: Date.now() + MEMORY_CACHE_MS };
  const summary = listings.map(({ Media: _media, ...listing }) => ({ ...listing, Media: [] }));
  memorySummaryCache = { listings: summary, expiresAt: Date.now() + MEMORY_CACHE_MS };

  await Promise.all([
    put(LISTINGS_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), listings }), {
      access: 'private', allowOverwrite: true, cacheControlMaxAge: 300, contentType: 'application/json'
    }),
    put(LISTINGS_SUMMARY_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), listings: summary }), {
      access: 'private', allowOverwrite: true, cacheControlMaxAge: 300, contentType: 'application/json'
    })
  ]);
}
