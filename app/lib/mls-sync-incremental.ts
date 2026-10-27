import { del, get, put } from '@vercel/blob';
import type { RESOProperty, RESOMedia } from './mock-properties';
import { fetchMLSGridPage, normalizeMLSGridProperty, dedupeListings, waitForMLSGridSlot } from './mlsgrid';
import { readMLSCache, writeMLSCache } from './mls-store';

type MlsGridRecord = Record<string, any>;
type StagedRecord = { source: string; record: MlsGridRecord };
type StagePage = { records: StagedRecord[]; processed: Array<RESOProperty | null> };
type SyncState = {
  version: 1;
  runId: string;
  phase: 'metadata' | 'media' | 'idle';
  sourceIndex: number;
  nextUrl?: string;
  pagePaths: string[];
  pageIndex: number;
  recordIndex: number;
  lastCompletedAt?: string;
  blockedUntil?: string;
  cacheSeeded?: boolean;
  prioritySorted?: boolean;
  startedAt: string;
};

const STATE_PATH = 'mls/sync-state.json';
const LOCK_PATH = 'mls/sync-lock.json';
const STAGING_ROOT = 'mls/sync-staging';
const LOCK_TTL_MS = 10 * 60 * 1000;
// A media-download 429 can be a short burst limit, not a full account suspension.
const RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;

class MLSGridRateLimitError extends Error {
  constructor(public retryAfterMs: number, public detail: string) {
    super('MLS Grid returned HTTP 429. Sync paused to avoid further requests.');
    this.name = 'MLSGridRateLimitError';
  }
}

async function acquireSyncLock() {
  const owner = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  const now = Date.now();
  const existing = await readJson<{ owner: string; expiresAt: number }>(LOCK_PATH);
  if (existing && existing.expiresAt > now) return null;
  if (existing) {
    try { await del(LOCK_PATH); } catch { return null; }
  }
  try {
    await put(LOCK_PATH, JSON.stringify({ owner, expiresAt: now + LOCK_TTL_MS }), {
      access: 'private', allowOverwrite: false, cacheControlMaxAge: 0, contentType: 'application/json'
    });
    const verified = await readJson<{ owner: string; expiresAt: number }>(LOCK_PATH);
    return verified?.owner === owner ? owner : null;
  } catch {
    return null;
  }
}

async function releaseSyncLock(owner: string) {
  const current = await readJson<{ owner: string; expiresAt: number }>(LOCK_PATH);
  if (current?.owner === owner) {
    try { await del(LOCK_PATH); } catch {}
  }
}
const DAILY_INTERVAL_MS = 23 * 60 * 60 * 1000;
const RECORDS_PER_INVOCATION = 10;
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

function normalizeCity(value: unknown) {
  return String(value || '').toLowerCase().replace(/[.'’,-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function inServiceArea(record: MlsGridRecord) {
  return SERVICE_CITIES.has(normalizeCity(record.City));
}
function syncPriority(record: MlsGridRecord) {
  const office = String(record.ListOfficeName || '').toLowerCase();
  const city = normalizeCity(record.City);
  const localOffice = /st\.?\s*mary['’]?s\s*real\s*estate/.test(office);
  const localCity = ['st marys', 'saint marys', 'wamego'].includes(city);
  const date = Date.parse(String(record.OriginalEntryTimestamp || record.OnMarketDate || record.ModificationTimestamp || '')) || 0;
  return { localOffice, localCity, date };
}
function sourceKeys() {
  const configured = (process.env.MLSGRID_ORIGINATING_SYSTEMS || '')
    .split(',').map(value => value.trim()).filter(Boolean)
    .filter(source => source === 'sunflower' || source === 'flinthills');
  return configured.length ? configured : ['sunflower', 'flinthills'];
}
function syncAccessToken() {
  if (process.env.VERCEL_ENV === 'production') return process.env.MLSGRID_ACCESS_TOKEN;
  if (process.env.MLSGRID_DEMO_ACCESS_TOKEN) return process.env.MLSGRID_DEMO_ACCESS_TOKEN;
  if (process.env.VERCEL_ENV === 'preview') return undefined;
  return process.env.MLSGRID_ACCESS_TOKEN;
}
function tokenConfigured() {
  return Boolean(syncAccessToken());
}
function storageKey(source: string, mediaKey: string) {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  const value = source + ':' + mediaKey;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ (code + i), 0x85ebca6b);
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
    return null;
  }
}
async function writeJson(pathname: string, value: unknown) {
  await put(pathname, JSON.stringify(value), {
    access: 'private', allowOverwrite: true, cacheControlMaxAge: 0, contentType: 'application/json'
  });
}
function newState(): SyncState {
  return {
    version: 1, runId: Date.now().toString(36), phase: 'metadata', sourceIndex: 0,
    pagePaths: [], pageIndex: 0, recordIndex: 0, startedAt: new Date().toISOString()
  };
}
async function loadState(): Promise<SyncState | null> {
  const state = await readJson<SyncState>(STATE_PATH);
  return state?.version === 1 ? state : null;
}
async function imageExists(mediaUrl: string) {
  if (!mediaUrl.startsWith('smre-blob:')) return false;
  const key = mediaUrl.slice('smre-blob:'.length);
  try {
    const stored = await get('mls/images/' + key + '.image', { access: 'private', useCache: false });
    if (!stored || stored.statusCode !== 200 || !stored.stream) return false;
    await stored.stream.cancel();
    return true;
  } catch {
    return false;
  }
}
function photos(record: MlsGridRecord): RESOMedia[] {
  const items = Array.isArray(record.Media) ? record.Media : [];
  return items
    .filter((item: any) => item?.MediaURL && (!item.MediaCategory || String(item.MediaCategory).toLowerCase() === 'photo'))
    .map((item: any, index: number) => ({
      MediaKey: String(item.MediaKey || `${record.ListingKey || record.ListingId || 'media'}-${index}`),
      MediaURL: String(item.MediaURL),
      MediaCategory: 'Photo' as const,
      ShortDescription: typeof item.ShortDescription === 'string' ? item.ShortDescription : undefined,
      PreferredPhoto: item.PreferredPhoto === true || item.PreferredPhotoYN === true || String(item.PreferredPhotoYN).toLowerCase() === 'true',
      MediaOrder: Number.isFinite(Number(item.MediaOrder)) ? Number(item.MediaOrder) : (Number.isFinite(Number(item.Order)) ? Number(item.Order) : index)
    }))
    .sort((a, b) => a.MediaOrder - b.MediaOrder);
}
async function downloadPreview(source: string, record: MlsGridRecord) {
  const availablePhotos = photos(record);
  const preview = availablePhotos.find(photo => photo.PreferredPhoto) || availablePhotos[0];
  if (!preview) {
    record.Media = [];
    return;
  }
  const token = syncAccessToken();
  if (!token) throw new Error('No MLS Grid access token is configured for this environment.');

  const key = storageKey(source, preview.MediaKey);
  try {
    // MLS Grid media URLs are signed, single-use URLs. Use the exact URL returned
    // by the API and never retry it: even a failed/expired URL may not be reused.
    await waitForMLSGridSlot();
    const response = await fetch(preview.MediaURL, {
      headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*', 'User-Agent': token },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after') || '');
      let detail = '';
      try { detail = (await response.text()).slice(0, 500); } catch {}
      const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : RATE_LIMIT_COOLDOWN_MS;
      throw new MLSGridRateLimitError(retryAfterMs, detail);
    }

    if (!response.ok || !response.body) {
      let detail = '';
      try { detail = (await response.text()).slice(0, 300); } catch {}
      console.error('MLS preview image rejected', {
        source,
        listingId: String(record.ListingId || record.ListingKey || ''),
        status: response.status,
        host: (() => { try { return new URL(preview.MediaURL).hostname; } catch { return 'invalid-url'; } })(),
        detail
      });
      // Do not retry this signed URL. A later sync must request a fresh URL.
      record.Media = [];
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.toLowerCase().startsWith('image/')) {
      console.error('MLS preview URL returned non-image content', {
        source,
        listingId: String(record.ListingId || record.ListingKey || ''),
        contentType
      });
      record.Media = [];
      return;
    }

    await put('mls/images/' + key + '.image', await response.arrayBuffer(), {
      access: 'private',
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
      contentType
    });
    record.Media = [{ ...preview, MediaURL: 'smre-blob:' + key }];
  } catch (error) {
    if (error instanceof MLSGridRateLimitError) {
      console.error('MLS preview download received HTTP 429', {
        source,
        listingId: String(record.ListingId || record.ListingKey || ''),
        detail: error.detail
      });
      // A single signed image URL returning 429 must not halt the entire MLS
      // inventory sync. The URL is single-use; skip this preview for this record
      // and continue processing later listings. The next sync can request a fresh URL.
      record.Media = [];
      return;
    }
    console.error('MLS preview image/storage failed', {
      source,
      listingId: String(record.ListingId || record.ListingKey || ''),
      error: error instanceof Error ? error.message : String(error)
    });
    record.Media = [];
  }
}
async function fetchMediaForRecord(source: string, record: MlsGridRecord) {
  const id = String(record.ListingId || record.ListingKey || '');
  if (!id) { record.Media = []; return; }
  const filter = "OriginatingSystemName eq '" + source + "' and MlgCanView eq true and ListingId eq '" + id.replace(/'/g, "''") + "'";
  let page;
  try {
    // Fetch a URL for only this listing, then download it immediately. MLS Grid
    // URLs are signed and single-use, so batching many URLs before downloading
    // risks consuming/expiring them before their turn.
    const apiBase = process.env.VERCEL_ENV !== 'production' && process.env.MLSGRID_DEMO_ACCESS_TOKEN
      ? 'https://api-demo.mlsgrid.com/v2'
      : (process.env.MLSGRID_API_BASE_URL || 'https://api.mlsgrid.com/v2');
    page = await fetchMLSGridPage(source, apiBase + '/Property?' + new URLSearchParams({
      '$filter': filter, '$expand': 'Media', '$top': '1'
    }).toString(), true);
  } catch (error) {
    const e = error as Error & { status?: number; retryAfterMs?: number };
    if (e.status === 429 || /: 429\b/.test(e.message || '')) {
      throw new MLSGridRateLimitError(e.retryAfterMs || RATE_LIMIT_COOLDOWN_MS, e.message || 'MLS Grid returned HTTP 429');
    }
    throw error;
  }
  const match = (page.value || []).find((item: MlsGridRecord) => String(item.ListingId || item.ListingKey || '') === id);
  record.Media = match && Array.isArray(match.Media) ? match.Media : [];
}

async function processBatch(records: StagedRecord[], existingById: Map<string, RESOProperty>) {
  const output: RESOProperty[] = [];
  let rateLimitError: MLSGridRateLimitError | undefined;

  // Process and retain each completed record independently. If MLS Grid throttles
  // the next request, already downloaded photos remain committed and won't be
  // downloaded again with single-use URLs on the next scheduled invocation.
  for (const item of records) {
    const record = item.record;
    const id = item.source + ':' + String(record.ListingId || record.ListingKey || '');
    const existing = existingById.get(id);
    const modification = String(record.ModificationTimestamp || '');
    const existingModification = String(existing?.ModificationTimestamp || '');
    const existingPreview = existing?.Media?.find(photo => photo.PreferredPhoto) || existing?.Media?.[0];
    const unchanged = Boolean(existing && modification && modification === existingModification);

    if (unchanged && existingPreview && await imageExists(existingPreview.MediaURL)) {
      record.Media = existing!.Media;
    } else {
      try {
        await fetchMediaForRecord(item.source, record);
        await downloadPreview(item.source, record);
      } catch (error) {
        if (error instanceof MLSGridRateLimitError) {
          rateLimitError = error;
          break;
        }
        throw error;
      }
    }

    const normalized = normalizeMLSGridProperty(record, item.source);

    // The incremental sync deliberately stores only a downloaded primary-photo
    // blob. Do not let that preview-only representation overwrite a full,
    // provisioned MLS Grid CDN gallery already stored for the listing.
    // The incremental endpoint's signed Media URLs are single-use and cannot
    // safely replace the durable CDN URLs in the saved gallery manifest.
    const existingFullGallery = existing?.Media?.length && existing.Media.length > 1 &&
      existing.Media.every(photo => {
        try {
          const url = new URL(photo.MediaURL);
          return url.protocol === 'https:' && url.hostname === 'cdn-stmarys.mlsgrid.com';
        } catch {
          return false;
        }
      });
    if (existingFullGallery && normalized.Media.length <= 1) {
      normalized.Media = existing!.Media;
    } else if (!normalized.Media.length && existing?.Media.length) {
      const preview = existing.Media.find(photo => photo.PreferredPhoto) || existing.Media[0];
      if (modification === existingModification && preview && await imageExists(preview.MediaURL)) {
        normalized.Media = [preview];
      }
    }
    output.push(normalized);
  }

  return { processed: output, rateLimitError };
}
export async function runIncrementalMLSGridSync() {
  if (!tokenConfigured()) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');
  const lockOwner = await acquireSyncLock();
  if (!lockOwner) return { ok: true, status: 'busy', message: 'Another MLS sync invocation holds the lock.' };
  try {
  let state = await loadState();
  if (state?.blockedUntil && Date.parse(state.blockedUntil) > Date.now()) {
    // Older versions persisted a one-hour pause even when MLS Grid reports the
    // subscription is in good standing. Shorten that legacy pause once so the
    // sync can retry cautiously, without repeatedly hitting the service.
    const remainingMs = Date.parse(state.blockedUntil) - Date.now();
    if (remainingMs > RATE_LIMIT_COOLDOWN_MS) {
      state.blockedUntil = new Date(Date.now() + RATE_LIMIT_COOLDOWN_MS).toISOString();
      await writeJson(STATE_PATH, state);
    }
    return { ok: true, status: 'rate-limited', retryAt: state.blockedUntil };
  }
  if (state?.blockedUntil && Date.parse(state.blockedUntil) <= Date.now()) {
    delete state.blockedUntil;
    await writeJson(STATE_PATH, state);
  }
  if (state?.phase === 'idle' && state.lastCompletedAt && Date.now() - Date.parse(state.lastCompletedAt) < DAILY_INTERVAL_MS) {
    return { ok: true, status: 'idle', nextRunAfter: new Date(Date.parse(state.lastCompletedAt) + DAILY_INTERVAL_MS).toISOString() };
  }
  if (!state || state.phase === 'idle') {
    state = newState();
    await writeJson(STATE_PATH, state);
  }
  const sources = sourceKeys();
  const existingListings = await readMLSCache();
  const existingById = new Map(existingListings.map(listing => [listing.ListingId, listing]));
  const publishedById = new Map(existingById);

  if (state.phase === 'metadata') {
    if (state.sourceIndex >= sources.length) {
      state.phase = 'media';
      state.pageIndex = 0;
      state.recordIndex = 0;
      await writeJson(STATE_PATH, state);
      return { ok: true, status: 'metadata-complete', pages: state.pagePaths.length };
    }
    const source = sources[state.sourceIndex];
    const page = await fetchMLSGridPage(source, state.nextUrl, false);
    const stagedRecords: StagedRecord[] = (page.value || []).filter(inServiceArea).map(record => ({ source, record }));
    const path = `${STAGING_ROOT}/${state.runId}/page-${state.pagePaths.length}.json`;
    await writeJson(path, { records: stagedRecords, processed: stagedRecords.map(() => null) } satisfies StagePage);
    state.pagePaths.push(path);
    state.nextUrl = page['@odata.nextLink'];
    if (!state.nextUrl) {
      state.sourceIndex++;
      state.nextUrl = undefined;
    }
    await writeJson(STATE_PATH, state);
    console.log('MLS sync metadata page saved', {
      runId: state.runId,
      source,
      records: stagedRecords.length,
      pagesSaved: state.pagePaths.length,
      hasNextPage: Boolean(state.nextUrl)
    });
    return { ok: true, status: 'metadata-page-saved', source, records: stagedRecords.length, pagesSaved: state.pagePaths.length };
  }

  if (state.phase === 'media') {
    // Sort staged records so the site's most relevant local listings receive
    // working preview images first. Preserve each processed result with its record.
    if (!state.prioritySorted) {
      for (const stagedPath of state.pagePaths) {
        const stagedPage = await readJson<StagePage>(stagedPath);
        if (!stagedPage) continue;
        const paired = stagedPage.records.map((record, index) => ({
          record,
          processed: stagedPage.processed[index] || null
        }));
        paired.sort((a, b) => {
          const ap = syncPriority(a.record.record);
          const bp = syncPriority(b.record.record);
          if (ap.localOffice !== bp.localOffice) return ap.localOffice ? -1 : 1;
          if (ap.localCity !== bp.localCity) return ap.localCity ? -1 : 1;
          return bp.date - ap.date;
        });
        stagedPage.records = paired.map(item => item.record);
        stagedPage.processed = paired.map(item => item.processed);
        await writeJson(stagedPath, stagedPage);
      }
      state.pageIndex = 0;
      state.recordIndex = 0;
      state.prioritySorted = true;
      await writeJson(STATE_PATH, state);
      console.log('MLS sync prioritized local listings for preview images', { pages: state.pagePaths.length });
    }
    // Publish any batches completed by an earlier deployment before starting
    // another batch. Previously, the public listing cache stayed stale until
    // the entire multi-hour initial scan completed, leaving expired MLS media
    // URLs in use even when newer preview images had already been downloaded.
    if (!state.cacheSeeded) {
      let seededCount = 0;
      for (const stagedPath of state.pagePaths) {
        const stagedPage = await readJson<StagePage>(stagedPath);
        if (!stagedPage) continue;
        for (const listing of stagedPage.processed) {
          if (listing) {
            publishedById.set(listing.ListingId, listing);
            seededCount++;
          }
        }
      }
      if (seededCount > 0) {
        await writeMLSCache(dedupeListings([...publishedById.values()]));
      }
      state.cacheSeeded = true;
      await writeJson(STATE_PATH, state);
      console.log('MLS sync published previously processed preview batches', { seededCount });
    }

    if (state.pageIndex >= state.pagePaths.length) {
      const allListings: RESOProperty[] = [];
      for (const path of state.pagePaths) {
        const page = await readJson<StagePage>(path);
        if (page) allListings.push(...page.processed.filter((item): item is RESOProperty => Boolean(item)));
      }
      const listings = dedupeListings(allListings);
      await writeMLSCache(listings);
      const completedAt = new Date().toISOString();
      const pathsToDelete = state.pagePaths;
      await writeJson(STATE_PATH, {
        ...state, phase: 'idle', lastCompletedAt: completedAt, pagePaths: [], pageIndex: 0, recordIndex: 0
      } satisfies SyncState);
      try { await del(pathsToDelete); }
      catch (error) { console.warn('Could not clean MLS staging files:', error instanceof Error ? error.message : error); }
      console.log('MLS incremental sync completed', { listings: listings.length, durationMs: Date.now() - Date.parse(state.startedAt) });
      return { ok: true, status: 'completed', listings: listings.length, updatedAt: completedAt };
    }
    const path = state.pagePaths[state.pageIndex];
    const page = await readJson<StagePage>(path);
    if (!page) throw new Error('MLS sync staging page is missing: ' + path);
    const end = Math.min(page.records.length, state.recordIndex + RECORDS_PER_INVOCATION);
    const batch = page.records.slice(state.recordIndex, end);
    console.log('MLS sync media batch starting', {
      runId: state.runId,
      page: state.pageIndex + 1,
      pages: state.pagePaths.length,
      start: state.recordIndex,
      count: batch.length
    });
    const batchResult = await processBatch(batch, existingById);
    const processed = batchResult.processed;
    for (let i = 0; i < processed.length; i++) page.processed[state.recordIndex + i] = processed[i];
    await writeJson(path, page);

    // Publish completed records immediately, including partial batches. This is
    // essential when a later media request hits a rate limit.
    for (const listing of processed) publishedById.set(listing.ListingId, listing);
    if (processed.length) {
      await writeMLSCache(dedupeListings([...publishedById.values()]));
    }

    state.recordIndex += processed.length;
    if (state.recordIndex >= page.records.length) { state.pageIndex++; state.recordIndex = 0; }
    if (batchResult.rateLimitError) {
      state.blockedUntil = new Date(Date.now() + Math.max(batchResult.rateLimitError.retryAfterMs, RATE_LIMIT_COOLDOWN_MS)).toISOString();
      await writeJson(STATE_PATH, state);
      console.error('MLS Grid returned HTTP 429; saved partial progress and paused sync', {
        retryAt: state.blockedUntil,
        processedBeforeLimit: processed.length,
        detail: batchResult.rateLimitError.detail
      });
      return { ok: true, status: 'rate-limited', processed: processed.length, retryAt: state.blockedUntil };
    }
    await writeJson(STATE_PATH, state);
    console.log('MLS sync media batch saved', {
      runId: state.runId,
      processed: processed.length,
      nextPage: state.pageIndex + 1,
      pages: state.pagePaths.length,
      complete: state.pageIndex >= state.pagePaths.length
    });
    return { ok: true, status: 'media-batch-saved', processed: processed.length, page: state.pageIndex + 1, pages: state.pagePaths.length, complete: state.pageIndex >= state.pagePaths.length };
  }
  return { ok: true, status: state.phase };
  } finally {
    await releaseSyncLock(lockOwner);
  }
}
