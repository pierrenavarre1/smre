import type { RESOProperty, RESOMedia, PropertyType, MLSSource } from './mock-properties';
import { del, get, put } from '@vercel/blob';
import { readMLSCache } from './mls-store';

const API_BASE = process.env.MLSGRID_API_BASE_URL || 'https://api.mlsgrid.com/v2';
const DEFAULT_SOURCES = ['sunflower', 'flinthills'] as const;
const SOURCE_CONFIG: Record<string, { label: MLSSource }> = {
  sunflower: { label: 'Sunflower MLS' },
  flinthills: { label: 'FHAR MLS' },
};

const SERVICE_CITIES = new Set([
  'st marys', 'saint marys', 'wamego', 'manhattan', 'topeka',
  'st george', 'saint george', 'rossville', 'silver lake', 'auburn', 'willard',
  'berryton', 'dover', 'elmont', 'pauline', 'tecumseh', 'wakarusa',
  'leonardville', 'ogden', 'randolph', 'riley', 'fort riley', 'keats', 'zeandale',
  'belvue', 'bellevue', 'emmett', 'havensville', 'louisville', 'olsburg', 'onaga',
  'westmoreland', 'wheaton', 'blaine', 'duluth', 'flush', 'fostoria', 'st clere',
  'saint clere', 'alma', 'paxico', 'maple hill', 'eskridge', 'harveyville',
  'mcfarland', 'junction city', 'mayetta', 'holton'
]);

type MlsGridRecord = Record<string, any>;
type MlsGridResponse = { value?: MlsGridRecord[]; '@odata.nextLink'?: string };

function asNumber(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function firstString(...values: unknown[]) {
  return values.find(v => typeof v === 'string' && v.trim()) as string | undefined;
}

function propertyType(value: unknown): PropertyType {
  const v = String(value || '').toLowerCase();
  if (v.includes('farm')) return 'Farm';
  if (v.includes('land')) return 'Land';
  if (v.includes('commercial')) return 'Commercial';
  return 'Residential';
}

function media(record: MlsGridRecord) {
  const items = Array.isArray(record.Media) ? record.Media : [];
  return items
    .filter((m: any) => m?.MediaURL && (!m.MediaCategory || String(m.MediaCategory).toLowerCase() === 'photo'))
    .map((m: any, index: number) => ({
      MediaKey: String(m.MediaKey || `${record.ListingKey || record.ListingId || 'media'}-${index}`),
      MediaURL: String(m.MediaURL),
      MediaCategory: 'Photo' as const,
      ShortDescription: firstString(m.ShortDescription),
      PreferredPhoto: m.PreferredPhoto === true || m.PreferredPhotoYN === true || String(m.PreferredPhotoYN).toLowerCase() === 'true',
      MediaOrder: Number.isFinite(Number(m.MediaOrder)) ? Number(m.MediaOrder) : (Number.isFinite(Number(m.Order)) ? Number(m.Order) : index)
    }))
    .sort((a, b) => a.MediaOrder - b.MediaOrder);
}

function normalizeCity(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.'’,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInServiceArea(record: MlsGridRecord) {
  return SERVICE_CITIES.has(normalizeCity(record.City));
}

function sourceKeys() {
  const configured = (process.env.MLSGRID_ORIGINATING_SYSTEMS || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  return configured.length
    ? configured.filter(source => source === 'sunflower' || source === 'flinthills')
    : [...DEFAULT_SOURCES];
}

function sourceLabel(source: string): MLSSource {
  return SOURCE_CONFIG[source]?.label || 'Sunflower MLS';
}

// MLS Grid provides one access token for the subscription. Both MLS sources use it.
function sourceToken(_source: string) {
  return process.env.MLSGRID_ACCESS_TOKEN;
}

export function isMLSGridConfigured() {
  return sourceKeys().some(source => Boolean(sourceToken(source)));
}

// Coordinate every MLS request across Vercel instances with a shared Blob lock.
// An in-memory queue is not sufficient: separate serverless instances each have
// their own queue and can collectively exceed the subscription's account limit.
const MIN_REQUEST_INTERVAL_MS = 2500;
const REQUEST_LOCK_PATH = 'mls/request-gate.lock';
const REQUEST_STATE_PATH = 'mls/request-gate-state.json';
const REQUEST_LOCK_TTL_MS = 15_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function readRequestGate<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
    return null;
  }
}

export async function waitForMLSGridSlot() {
  const owner = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  let acquired = false;
  for (let attempt = 0; attempt < 240; attempt++) {
    try {
      await put(REQUEST_LOCK_PATH, JSON.stringify({ owner, expiresAt: Date.now() + REQUEST_LOCK_TTL_MS }), {
        access: 'private', allowOverwrite: false, cacheControlMaxAge: 0, contentType: 'application/json'
      });
      acquired = true;
      break;
    } catch {
      const lock = await readRequestGate<{ owner: string; expiresAt: number }>(REQUEST_LOCK_PATH);
      if (lock && lock.expiresAt <= Date.now()) {
        try { await del(REQUEST_LOCK_PATH); } catch {}
      }
      await sleep(250);
    }
  }
  if (!acquired) throw new Error('Timed out waiting for the shared MLS Grid request limiter.');

  try {
    const state = await readRequestGate<{ nextAllowedAt?: number }>(REQUEST_STATE_PATH);
    const wait = Math.max(0, Number(state?.nextAllowedAt || 0) - Date.now());
    if (wait) await sleep(wait);
    await put(REQUEST_STATE_PATH, JSON.stringify({ nextAllowedAt: Date.now() + MIN_REQUEST_INTERVAL_MS }), {
      access: 'private', allowOverwrite: true, cacheControlMaxAge: 0, contentType: 'application/json'
    });
  } finally {
    const lock = await readRequestGate<{ owner: string }>(REQUEST_LOCK_PATH);
    if (lock?.owner === owner) {
      try { await del(REQUEST_LOCK_PATH); } catch {}
    }
  }
}

export async function fetchMLSGridPage(
  source: string,
  url?: string,
  expandMedia = false
): Promise<MlsGridResponse> {
  const token = sourceToken(source);
  if (!token) throw new Error('No MLS Grid access token is configured for ' + source + '.');

  await waitForMLSGridSlot();

  const endpoint = url || API_BASE + '/Property?' + new URLSearchParams({
    '$filter': "OriginatingSystemName eq '" + source + "' and MlgCanView eq true and StandardStatus in ('Active','Pending')",
    ...(expandMedia ? { '$expand': 'Media' } : {}),
    // MLS Grid allows up to 1,000 records when Media is expanded.
    '$top': expandMedia ? '1000' : '5000'
  }).toString();

  const response = await fetch(endpoint, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json',
      'Accept-Encoding': 'gzip'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    let detail = '';
    try { detail = (await response.text()).slice(0, 500); } catch {}
    const error = new Error('MLS Grid request failed for ' + source + ': ' + response.status + ' ' + response.statusText + (detail ? ' - ' + detail : '')) as Error & { status?: number; retryAfterMs?: number };
    error.status = response.status;
    const retryAfter = Number(response.headers.get('retry-after') || '');
    error.retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined;
    throw error;
  }

  return response.json();
}

async function fetchAllPropertyRecords(source: string, expandMedia = false) {
  const records: MlsGridRecord[] = [];
  let url: string | undefined;

  do {
    const page = await fetchMLSGridPage(source, url, expandMedia);
    records.push(...(page.value || []));
    url = page['@odata.nextLink'];
  } while (url);

  return records;
}

async function fetchMediaForRecords(source: string, records: MlsGridRecord[]) {
  const byId = new Map<string, MlsGridRecord>();
  records.forEach(record => {
    const id = String(record.ListingId || record.ListingKey || '');
    if (id) byId.set(id, record);
  });

  const ids = [...byId.keys()];

  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const values = batch.map(id => "'" + id.replace(/'/g, "''") + "'").join(',');
    const filter =
      "OriginatingSystemName eq '" + source +
      "' and MlgCanView eq true and ListingId in (" + values + ")";

    const page = await fetchMLSGridPage(
      source,
      API_BASE + '/Property?' + new URLSearchParams({
        '$filter': filter,
        '$expand': 'Media',
        '$top': '100'
      }).toString(),
      true
    );

    for (const record of page.value || []) {
      const id = String(record.ListingId || record.ListingKey || '');
      const existing = byId.get(id);
      if (existing) existing.Media = record.Media;
    }
  }

  return [...byId.values()];
}

const freshMediaCache = new Map<string, { expiresAt: number; media: RESOMedia[] }>();
const freshPreviewCache = new Map<string, { expiresAt: number; media: RESOMedia[] }>();
const FRESH_MEDIA_CACHE_MS = 10 * 60_000;

// MLS Grid media URLs are signed, single-use download URLs. Persist the actual
// image bytes and expose only a stable internal key to the website. Keep this
// helper browser-compatible because this module is also imported by client code.
function mediaStorageKey(value: string) {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ (code + i), 0x85ebca6b);
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

function isProvisionedCdnUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cdn-stmarys.mlsgrid.com';
  } catch {
    return false;
  }
}

function mediaManifestPath(listing: RESOProperty) {
  if (!listing.ModificationTimestamp) return '';
  const key = mediaStorageKey('cdn-manifest:' + listing.ListingId + ':' + listing.ModificationTimestamp);
  return 'mls/media-manifests/' + key + '.json';
}

async function readCdnMediaManifest(listing: RESOProperty): Promise<RESOMedia[]> {
  const pathname = mediaManifestPath(listing);
  if (!pathname) return [];
  try {
    const stored = await get(pathname, { access: 'private', useCache: false });
    if (!stored || stored.statusCode !== 200 || !stored.stream) return [];
    const payload = JSON.parse(await new Response(stored.stream).text());
    const items = Array.isArray(payload?.media) ? payload.media as RESOMedia[] : [];
    return items.length > 0 && items.every(photo => isProvisionedCdnUrl(photo.MediaURL)) ? items : [];
  } catch {
    return [];
  }
}

async function writeCdnMediaManifest(listing: RESOProperty, items: RESOMedia[]) {
  const pathname = mediaManifestPath(listing);
  if (!pathname || !items.length || !items.every(photo => isProvisionedCdnUrl(photo.MediaURL))) return;
  try {
    await put(pathname, JSON.stringify({ version: 1, media: items }), {
      access: 'private',
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
      contentType: 'application/json'
    });
  } catch (error) {
    // The current page can still use the fresh CDN URLs; a failed manifest
    // write only means another cold function may need to refresh them later.
    console.warn('Unable to persist MLS CDN photo manifest:', error instanceof Error ? error.message : error);
  }
}

async function downloadAndStoreMedia(source: string, records: MlsGridRecord[], existingById: Map<string, RESOProperty>) {
  const token = sourceToken(source);
  if (!token) return;

  // Listing cards need one reliable preview image per property. Keeping every
  // original MLS photo exceeded the 1 GB Blob quota and made all images fail.
  const jobs: Array<{ record: MlsGridRecord; photo: RESOMedia }> = [];
  for (const record of records) {
    const photos = media(record);
    const preview = photos.find(photo => photo.PreferredPhoto) || photos[0];
    if (!preview) {
      record.Media = [];
      continue;
    }

    const originalId = String(record.ListingId || record.ListingKey || '');
    const existing = existingById.get(source + ':' + originalId);
    const oldPreview = existing?.Media?.find(photo => photo.PreferredPhoto) || existing?.Media?.[0];
    // Preserve a previously downloaded local image when the MLS MediaKey is unchanged.
    // This prevents daily syncs from downloading and rewriting the same preview again.
    if (oldPreview?.MediaURL?.startsWith('smre-blob:') && oldPreview.MediaKey === preview.MediaKey) {
      const oldKey = oldPreview.MediaURL.slice('smre-blob:'.length);
      try {
        // Verify the referenced local image still exists. A previous interrupted
        // cleanup may have removed image blobs while leaving the listing JSON intact.
        const stored = await get('mls/images/' + oldKey + '.image', { access: 'private', useCache: false });
        if (stored?.statusCode === 200 && stored.stream) {
          await stored.stream.cancel();
          record.Media = [{ ...preview, MediaURL: oldPreview.MediaURL }];
          continue;
        }
      } catch {
        // Missing cache entry: refresh it from MLS Grid below.
      }
    }

    jobs.push({ record, photo: preview as RESOMedia });
  }
  const validJobs = jobs.filter(job => Boolean(job.photo));
  let cursor = 0;

  async function downloadWithRetry(photo: RESOMedia) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        // Share a serialized 1.5-second request gate across API and media requests.
        await waitForMLSGridSlot();
        const response = await fetch(photo.MediaURL, {
          headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*', 'User-Agent': token! },
          redirect: 'follow',
          cache: 'no-store',
          signal: AbortSignal.timeout(12000)
        });

        if (response.status === 429 && attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1) * (attempt + 1)));
          continue;
        }
        if (!response.ok || !response.body) {
          throw new Error('MLS image download failed: ' + response.status + ' ' + response.statusText);
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        if (!contentType.toLowerCase().startsWith('image/')) {
          throw new Error('MLS media URL returned non-image content.');
        }

        const key = mediaStorageKey(source + ':' + photo.MediaKey);
        await put('mls/images/' + key + '.image', await response.arrayBuffer(), {
          access: 'private',
          allowOverwrite: true,
          cacheControlMaxAge: 31536000,
          contentType
        });
        return key;
      } catch (error) {
        if (attempt === 3) {
          console.error('MLS image download/storage failed:', error instanceof Error ? error.message : error);
          return '';
        }
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    return '';
  }

  // One worker is intentional: the subscription's published limit is 1 request per second.
  // Keep media downloads strictly serialized with API calls to avoid 429 cooldowns.
  const workers = Array.from({ length: 1 }, async () => {
    while (cursor < validJobs.length) {
      const job = validJobs[cursor++];
      const key = await downloadWithRetry(job.photo);
      job.record.Media = key
        ? [{ ...job.photo, MediaURL: 'smre-blob:' + key }]
        : [];
    }
  });

  await Promise.all(workers);
}

function listingSourceAndId(listing: RESOProperty) {
  const separator = listing.ListingId.indexOf(':');
  if (separator < 0) return null;
  return { source: listing.ListingId.slice(0, separator), listingId: listing.ListingId.slice(separator + 1) };
}

async function fetchFreshMediaBatch(source: string, listingIds: string[]) {
  const values = listingIds.map(id => "'" + id.replace(/'/g, "''") + "'").join(',');
  const filter = "OriginatingSystemName eq '" + source + "' and MlgCanView eq true and ListingId in (" + values + ")";
  const page = await fetchMLSGridPage(source, API_BASE + '/Property?' + new URLSearchParams({
    '$filter': filter, '$expand': 'Media', '$top': '100'
  }).toString(), true);
  const result = new Map<string, RESOMedia[]>();
  for (const record of page.value || []) {
    const id = String(record.ListingId || record.ListingKey || '');
    if (id) result.set(id, media(record));
  }
  return result;
}

export async function fetchFreshPreviewMedia(listings: RESOProperty[]) {
  const result = new Map<string, RESOMedia[]>();
  for (const listing of listings) {
    const cachedPreview = freshPreviewCache.get(listing.ListingId);
    if (cachedPreview && cachedPreview.expiresAt > Date.now()) {
      result.set(listing.ListingId, cachedPreview.media);
      continue;
    }

    // Page rendering must never trigger live MLS Grid requests. Use the media
    // saved by the scheduled sync, and let the next sync refresh missing media.
    const localPreview = listing.Media.find(photo => photo.PreferredPhoto) || listing.Media[0];
    const preview = localPreview ? [localPreview] : [];
    result.set(listing.ListingId, preview);
    freshPreviewCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: preview });
  }
  return result;
}

export async function fetchFreshMediaForListing(listing: RESOProperty) {
  const cached = freshMediaCache.get(listing.ListingId);
  if (cached && cached.expiresAt > Date.now()) return cached.media;

  // A complete CDN manifest is durable and can be reused without another
  // MLS Grid request. The incremental sync stores the full ordered manifest.
  if (listing.Media.length > 0 && listing.Media.every(photo => isProvisionedCdnUrl(photo.MediaURL))) {
    freshMediaCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: listing.Media });
    return listing.Media;
  }

  // Persist CDN manifests in shared Blob storage, keyed by the listing's MLS
  // modification timestamp. This avoids a fresh MLS Grid request on every
  // serverless cold start while naturally invalidating the manifest on edits.
  const persistedManifest = await readCdnMediaManifest(listing);
  if (persistedManifest.length) {
    freshMediaCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: persistedManifest });
    const preferred = persistedManifest.find(photo => photo.PreferredPhoto) || persistedManifest[0];
    freshPreviewCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: preferred ? [preferred] : [] });
    return persistedManifest;
  }

  // Existing sync records may contain only a Blob preview (or no preview if a
  // previous download was throttled). Refresh this listing's full manifest
  // once, and persist it only when every URL is on the provisioned CDN.
  if (isMLSGridConfigured()) {
    try {
      const freshListing = await fetchMLSGridLiveListing(listing.ListingId);
      const freshMedia = freshListing?.Media || [];
      if (freshMedia.length) {
        if (freshMedia.every(photo => isProvisionedCdnUrl(photo.MediaURL))) {
          await writeCdnMediaManifest(listing, freshMedia);
        }
        freshMediaCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: freshMedia });
        const preferred = freshMedia.find(photo => photo.PreferredPhoto) || freshMedia[0];
        freshPreviewCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: preferred ? [preferred] : [] });
        return freshMedia;
      }
    } catch (error) {
      console.error('Unable to refresh listing gallery media:', error instanceof Error ? error.message : error);
    }
  }

  // Preserve the saved preview as a fallback if a fresh full manifest cannot
  // be obtained; never turn a previously visible photo into an empty gallery.
  return listing.Media;
}

export async function fetchMLSGridLiveIndex(): Promise<RESOProperty[]> {
  const all: RESOProperty[] = [];

  for (const source of sourceKeys()) {
    if (!sourceToken(source)) continue;
    try {
      // Emergency page fallback: request metadata only and fetch one page per
      // MLS. Never expand/download every photo during a public page request.
      // Full replication and photo downloads belong in the scheduled sync.
      const page = await fetchMLSGridPage(source);
      for (const record of (page.value || []).filter(isInServiceArea)) {
        all.push(normalizeMLSGridProperty(record, source));
      }
    } catch (error) {
      console.error('MLS Grid live index failed for ' + source + ':', error);
    }
  }

  return dedupeListings(all);
}

export async function fetchMLSGridLiveListingWithRetry(internalId: string): Promise<RESOProperty | undefined> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchMLSGridLiveListing(internalId);
    } catch (error) {
      lastError = error;
      const status = (error as Error & { status?: number }).status;
      // Do not retry authorization, validation, or rate-limit responses.
      if (status && (status < 500 || status === 429)) throw error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('MLS Grid detail refresh failed.');
}

export async function fetchMLSGridLiveListing(internalId: string): Promise<RESOProperty | undefined> {
  const separator = internalId.indexOf(':');
  if (separator < 0) return undefined;
  const source = internalId.slice(0, separator);
  const listingId = internalId.slice(separator + 1);
  if ((source !== 'sunflower' && source !== 'flinthills') || !sourceToken(source)) return undefined;

  const filter = "OriginatingSystemName eq '" + source +
    "' and MlgCanView eq true and ListingId eq '" + listingId.replace(/'/g, "''") + "'";
  const page = await fetchMLSGridPage(source, API_BASE + '/Property?' + new URLSearchParams({
    '$filter': filter,
    '$expand': 'Media',
    '$top': '1'
  }).toString(), true);
  const record = page.value?.[0];
  if (record && listingId === 'FHR20262853') {
    const agentFieldKeys = Object.keys(record).filter(key => /listagent|agent(first|last|full|middle)|agentkey/i.test(key));
    const relatedAgent = record.ListAgent && typeof record.ListAgent === 'object' ? record.ListAgent : undefined;
    console.info('[MLS attribution field diagnostic]', {
      source,
      listingId,
      agentFieldKeys,
      populatedAgentFields: agentFieldKeys.filter(key => {
        const value = record[key];
        return typeof value === 'string' ? Boolean(value.trim()) : value !== null && value !== undefined;
      }),
      relatedAgentKeys: relatedAgent ? Object.keys(relatedAgent) : []
    });
  }
  return record ? normalizeMLSGridProperty(record, source) : undefined;
}

export type MLSNumberLookupResult = {
  matches: RESOProperty[];
  outsideServiceArea: Array<{ source: string; city: string; listingId: string }>;
  notEligible: Array<{ source: string; status: string; listingId: string }>;
};

export async function lookupMLSGridListingsByNumber(mlsNumber: string): Promise<MLSNumberLookupResult> {
  const number = mlsNumber.trim().replace(/'/g, "''");
  const result: MLSNumberLookupResult = { matches: [], outsideServiceArea: [], notEligible: [] };
  if (!number || number.length > 40) return result;

  for (const source of sourceKeys()) {
    if (!sourceToken(source)) continue;
    // ListingId is the RESO field carrying the MLS-assigned number. Also allow
    // a source/feed prefix before the entered number, while keeping the query
    // scoped to one originating system to avoid cross-feed false matches.
    const filter = "OriginatingSystemName eq '" + source + "' and ListingId eq '" + number + "'";
    const page = await fetchMLSGridPage(source, API_BASE + '/Property?' + new URLSearchParams({
      '$filter': filter,
      '$expand': 'Media',
      '$top': '20'
    }).toString(), true);

    for (const record of page.value || []) {
      const listingId = String(record.ListingId || record.ListingKey || '');
      const status = String(record.StandardStatus || '');
      if (record.MlgCanView !== true || !['Active', 'Pending'].includes(status)) {
        result.notEligible.push({ source, status: status || 'Unknown', listingId });
        continue;
      }
      const listing = normalizeMLSGridProperty(record, source);
      if (!isInServiceArea({ City: listing.City })) {
        result.outsideServiceArea.push({ source, city: listing.City, listingId });
        continue;
      }
      result.matches.push(listing);
    }
  }
  return result;
}

export async function fetchMLSGridListingsByNumber(mlsNumber: string): Promise<RESOProperty[]> {
  return (await lookupMLSGridListingsByNumber(mlsNumber)).matches;
}

export async function fetchMLSGridListings(): Promise<RESOProperty[]> {
  const existingListings = await readMLSCache();
  const existingById = new Map(existingListings.map(listing => [listing.ListingId, listing]));
  const sourceRecords: Array<{ source: string; records: MlsGridRecord[] }> = [];

  for (const source of sourceKeys()) {
    if (!sourceToken(source)) {
      console.warn('MLS Grid source skipped because no access token is configured for ' + source + '.');
      continue;
    }

    try {
      const records = await fetchAllPropertyRecords(source);
      const serviceAreaRecords = records.filter(isInServiceArea);
      const recordsWithMedia = await fetchMediaForRecords(source, serviceAreaRecords);
      sourceRecords.push({ source, records: recordsWithMedia });
    } catch (error) {
      console.error('MLS Grid source failed for ' + source + ':', error);
    }
  }

  const all: RESOProperty[] = [];
  for (const { source, records } of sourceRecords) {
    await downloadAndStoreMedia(source, records, existingById);
    for (const record of records) {
      all.push(normalizeMLSGridProperty(record, source));
    }
  }

  return dedupeListings(all);
}

function normalizeAddressPart(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(north|south|east|west)\b/g, (m) => ({ north: 'n', south: 's', east: 'e', west: 'w' } as Record<string, string>)[m])
    .replace(/\b(street|avenue|road|drive|lane|court|circle|boulevard|highway|parkway|place|terrace|trail|way)\b/g, (m) => ({
      street: 'st', avenue: 'ave', road: 'rd', drive: 'dr', lane: 'ln', court: 'ct',
      circle: 'cir', boulevard: 'blvd', highway: 'hwy', parkway: 'pkwy', place: 'pl',
      terrace: 'ter', trail: 'trl', way: 'way'
    } as Record<string, string>)[m])
    .replace(/[^a-z0-9]/g, '');
}

function listingAddressKey(listing: RESOProperty) {
  return [
    listing.StreetNumber,
    listing.StreetName,
    listing.City,
    listing.StateOrProvince,
    listing.PostalCode
  ].map(normalizeAddressPart).join('|');
}

function sameApproximateLocation(a: RESOProperty, b: RESOProperty) {
  if (!a.Latitude || !a.Longitude || !b.Latitude || !b.Longitude) return false;
  if (normalizeCity(a.City) !== normalizeCity(b.City)) return false;
  if (a.PostalCode && b.PostalCode && a.PostalCode !== b.PostalCode) return false;
  return Math.abs(a.Latitude - b.Latitude) < 0.00035 &&
    Math.abs(a.Longitude - b.Longitude) < 0.00035;
}

function isSMREListing(listing: RESOProperty) {
  return /st\.?\s*mary['’]?s\s*real\s*estate/i.test(listing.ListOfficeName || '');
}

function listingDateValue(listing: RESOProperty) {
  const value = Date.parse(listing.ListingDate || listing.ModificationTimestamp || '');
  return Number.isFinite(value) ? value : 0;
}

function preferListing(a: RESOProperty, b: RESOProperty) {
  const aSMRE = isSMREListing(a);
  const bSMRE = isSMREListing(b);
  if (aSMRE !== bSMRE) return aSMRE ? a : b;

  if (a.Media.length !== b.Media.length) return a.Media.length > b.Media.length ? a : b;

  return listingDateValue(a) >= listingDateValue(b) ? a : b;
}

export function dedupeListings(listings: RESOProperty[]) {
  const result: RESOProperty[] = [];
  const byAddress = new Map<string, number>();

  for (const listing of listings) {
    const addressKey = listingAddressKey(listing);
    const exactIndex = addressKey ? byAddress.get(addressKey) : undefined;

    if (exactIndex !== undefined) {
      result[exactIndex] = preferListing(result[exactIndex], listing);
      continue;
    }

    const nearbyIndex = result.findIndex(existing => sameApproximateLocation(existing, listing));
    if (nearbyIndex >= 0) {
      result[nearbyIndex] = preferListing(result[nearbyIndex], listing);
      continue;
    }

    if (addressKey) byAddress.set(addressKey, result.length);
    result.push(listing);
  }

  return result;
}

function areaInSquareFeet(value: unknown, units: unknown) {
  const area = asNumber(value);
  if (area <= 0) return 0;
  const unit = String(units || '').toLowerCase();
  if (unit.includes('meter') || unit === 'sqm' || unit === 'm2') return Math.round(area * 10.7639104167);
  return Math.round(area);
}

function livingAreaInSquareFeet(record: MlsGridRecord) {
  // Prefer the MLS's explicitly designated living-area fields.
  const direct = areaInSquareFeet(record.LivingArea, record.LivingAreaUnits)
    || areaInSquareFeet(record.LivingAreaTotal, record.LivingAreaUnits);
  if (direct > 0) return direct;

  // Some feeds omit LivingArea but provide finished above/below-grade areas.
  // These are finished floor areas; do not substitute total building area,
  // garage area, or lot area for a home's living space.
  const above = areaInSquareFeet(record.AboveGradeFinishedArea, record.AboveGradeFinishedAreaUnits || record.LivingAreaUnits);
  const below = areaInSquareFeet(record.BelowGradeFinishedArea, record.BelowGradeFinishedAreaUnits || record.LivingAreaUnits);
  return above + below;
}

export function normalizeMLSGridProperty(record: MlsGridRecord, source = 'sunflower'): RESOProperty {
  const listPrice = asNumber(record.ListPrice);
  const livingArea = livingAreaInSquareFeet(record);
  const lotSqFt = asNumber(record.LotSizeSquareFeet || record.LotSizeSquareFeetTotal || record.LotSizeSqFt);
  const totalBaths = asNumber(record.BathroomsTotalInteger) || asNumber(record.BathroomsTotal) || asNumber(record.BathroomsFull);
  const fullBaths = asNumber(record.BathroomsFull) || asNumber(record.BathroomsTotalInteger) || asNumber(record.BathroomsTotal);
  const halfBaths = asNumber(record.BathroomsHalf ?? record.BathroomsPartial ?? record.BathroomsThreeQuarter);
  const originalId = String(record.ListingId || record.ListingKey || '');
  const sourceKey = source.toLowerCase();
  const internalId = sourceKey + ':' + originalId;

  return {
    ListingId: internalId,
    ModificationTimestamp: firstString(record.ModificationTimestamp),
    ListingKey: String(record.ListingKey || originalId),
    StandardStatus: ['Pending', 'Closed'].includes(String(record.StandardStatus))
      ? String(record.StandardStatus) as RESOProperty['StandardStatus']
      : 'Active',
    ListPrice: listPrice,
    BedroomsTotal: asNumber(record.BedroomsTotal),
    BathroomsTotalInteger: totalBaths,
    BathroomsFull: fullBaths,
    BathroomsHalf: halfBaths,
    PropertyType: propertyType(record.PropertyType),
    PropertySubType: firstString(record.PropertySubType) || '',
    StreetNumber: firstString(record.StreetNumber) || '',
    StreetName: firstString(record.StreetName) || '',
    City: firstString(record.City) || '',
    StateOrProvince: firstString(record.StateOrProvince) || 'KS',
    PostalCode: firstString(record.PostalCode) || '',
    LivingArea: livingArea,
    LotSizeAcres: asNumber(record.LotSizeAcres || (lotSqFt ? lotSqFt / 43560 : 0)),
    LotSizeSqFt: lotSqFt || undefined,
    YearBuilt: asNumber(record.YearBuilt),
    PublicRemarks: firstString(record.PublicRemarks) || '',
    Media: media(record),
    ListAgentFullName: firstString(record.ListAgentFullName, [firstString(record.ListAgentFirstName), firstString(record.ListAgentLastName)].filter(Boolean).join(' ')) || '',
    ListAgentMlsId: firstString(record.ListAgentMlsId) || '',
    ListAgentEmail: firstString(record.ListAgentEmail) || '',
    ListAgentDirectPhone: firstString(record.ListAgentDirectPhone, record.ListAgentPreferredPhone) || '',
    ListOfficeName: firstString(record.ListOfficeName) || '',
    ListOfficeEmail: firstString(record.ListOfficeEmail) || '',
    ListOfficePhone: firstString(record.ListOfficePhone) || '',
    MlsSource: sourceLabel(source),
    Latitude: asNumber(record.Latitude),
    Longitude: asNumber(record.Longitude),
    PricePerSqFt: asNumber(record.PricePerSquareFoot || (livingArea ? listPrice / livingArea : 0)) || undefined,
    AnnualTaxes: asNumber(record.TaxAnnualAmount) || undefined,
    TaxYear: asNumber(record.TaxYear) || undefined,
    GarageSpaces: asNumber(record.GarageSpaces) || undefined,
    ParkingFeatures: Array.isArray(record.ParkingFeatures) ? record.ParkingFeatures.join(', ') : firstString(record.ParkingFeatures),
    Basement: Array.isArray(record.Basement) ? record.Basement.join(', ') : firstString(record.Basement),
    Foundation: Array.isArray(record.FoundationDetails) ? record.FoundationDetails.join(', ') : firstString(record.FoundationDetails),
    Roof: Array.isArray(record.Roof) ? record.Roof.join(', ') : firstString(record.Roof),
    Exterior: Array.isArray(record.ExteriorFeatures) ? record.ExteriorFeatures.join(', ') : firstString(record.ExteriorFeatures),
    Flooring: Array.isArray(record.Flooring) ? record.Flooring.join(', ') : firstString(record.Flooring),
    Appliances: Array.isArray(record.Appliances) ? record.Appliances.join(', ') : firstString(record.Appliances),
    Heating: Array.isArray(record.Heating) ? record.Heating.join(', ') : firstString(record.Heating),
    Cooling: Array.isArray(record.Cooling) ? record.Cooling.join(', ') : firstString(record.Cooling),
    WaterSource: Array.isArray(record.WaterSource) ? record.WaterSource.join(', ') : firstString(record.WaterSource),
    Sewer: Array.isArray(record.Sewer) ? record.Sewer.join(', ') : firstString(record.Sewer),
    HOA: firstString(record.AssociationName),
    Schools: Array.isArray(record.SchoolDistrict) ? record.SchoolDistrict.join(', ') : firstString(record.SchoolDistrict),
    Directions: firstString(record.Directions),
    ArchitecturalStyle: Array.isArray(record.ArchitecturalStyle) ? record.ArchitecturalStyle.join(', ') : firstString(record.ArchitecturalStyle),
    ListingDate: firstString(record.OriginalEntryTimestamp, record.OnMarketDate),
    MLSNumber: firstString(record.ListingId),
    ParcelNumber: firstString(record.ParcelNumber),
    OtherStructures: Array.isArray(record.OtherStructures) ? record.OtherStructures.join(', ') : firstString(record.OtherStructures),
    Features: Array.isArray(record.InteriorFeatures) ? record.InteriorFeatures : undefined
  };
}
