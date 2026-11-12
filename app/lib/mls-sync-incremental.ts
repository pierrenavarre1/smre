import { mlsBlobPath } from './mls-blob-path';
import { del, get, put } from '@vercel/blob';
import type { RESOProperty, RESOMedia } from './mock-properties';
import { fetchMLSGridPage, fetchMLSGridLiveListing, normalizeMLSGridProperty, dedupeListings, waitForMLSGridSlot } from './mlsgrid';
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
  indexSeeded?: boolean;
  prioritySorted?: boolean;
  priorityVersion?: number;
  startedAt: string;
  incremental?: boolean;
  sourceWatermarks?: Record<string, string>;
  nextWatermarks?: Record<string, string>;
};

const STATE_PATH = mlsBlobPath('mls/sync-state.json');
const LOCK_PATH = mlsBlobPath('mls/sync-lock.json');
const STAGING_ROOT = mlsBlobPath('mls/sync-staging');
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
const INCREMENTAL_INTERVAL_MS = 15 * 60 * 1000;
const RECORDS_PER_INVOCATION = 50;
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
  const localCity = SERVICE_CITIES.has(city);
  const date = Date.parse(String(record.OriginalEntryTimestamp || record.OnMarketDate || record.ModificationTimestamp || '')) || 0;
  return { localOffice, localCity, date };
}
function sourceKeys() {
  const configured = (process.env.MLSGRID_ORIGINATING_SYSTEMS || '')
    .split(',').map(value => value.trim()).filter(Boolean)
    .filter(source => source === 'sunflower' || source === 'flinthills');
  return configured.length ? configured : ['sunflower', 'flinthills'];
}
function tokenConfigured() {
  return Boolean(process.env.MLSGRID_ACCESS_TOKEN);
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
function newState(previous?: SyncState): SyncState {
  return {
    version: 1, runId: Date.now().toString(36), phase: 'metadata', sourceIndex: 0,
    pagePaths: [], pageIndex: 0, recordIndex: 0, startedAt: new Date().toISOString(),
    incremental: Boolean(previous?.sourceWatermarks),
    sourceWatermarks: previous?.sourceWatermarks || {},
    nextWatermarks: previous?.sourceWatermarks || {}
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
    const stored = await get(mlsBlobPath('mls/images/' + key + '.image'), { access: 'private', useCache: false });
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

function isProvisionedCdnUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cdn-stmarys.mlsgrid.com';
  } catch {
    return false;
  }
}

async function downloadPreview(source: string, record: MlsGridRecord) {
  const availablePhotos = photos(record);
  // When MLS Grid supplies its provisioned CDN URLs for the complete manifest,
  // retain every photo in MediaOrder and serve them from the CDN. Do not fetch
  // or copy these files through Vercel Blob.
  if (availablePhotos.length > 0 && availablePhotos.every(photo => isProvisionedCdnUrl(photo.MediaURL))) {
    record.Media = availablePhotos;
    return;
  }
  const preview = availablePhotos.find(photo => photo.PreferredPhoto) || availablePhotos[0];
  if (!preview) {
    record.Media = [];
    return;
  }
  if (!process.env.MLSGRID_ACCESS_TOKEN) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');

  const key = storageKey(source, preview.MediaKey);
  try {
    // MLS Grid media URLs are signed, single-use URLs. Use the exact URL returned
    // by the API and never retry it: even a failed/expired URL may not be reused.
    await waitForMLSGridSlot();
    const response = await fetch(preview.MediaURL, {
      headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*', 'User-Agent': process.env.MLSGRID_ACCESS_TOKEN! },
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

    await put(mlsBlobPath('mls/images/' + key + '.image'), await response.arrayBuffer(), {
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
        // Use the same MLS Grid detail/media retrieval path as the working production site.
        // This keeps media expansion, source-token selection, and CDN URLs consistent.
        const freshListing = await fetchMLSGridLiveListing(id);
        record.Media = freshListing?.Media || [];
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
    if (!normalized.Media.length && existing?.Media.length) {
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
  if (state?.phase === 'idle' && state.lastCompletedAt && Date.now() - Date.parse(state.lastCompletedAt) < INCREMENTAL_INTERVAL_MS) {
    return { ok: true, status: 'idle', nextRunAfter: new Date(Date.parse(state.lastCompletedAt) + INCREMENTAL_INTERVAL_MS).toISOString() };
  }
  if (!state || state.phase === 'idle') {
    state = newState(state || undefined);
    await writeJson(STATE_PATH, state);
  }
  const sources = sourceKeys();
  const existingListings = await readMLSCache();
  const existingById = new Map(existingListings.map(listing => [listing.ListingId, listing]));
  const publishedById = new Map(existingById);

  if (state.phase === 'metadata') {
    if (state.sourceIndex >= sources.length) {
      state.phase = 'media';
      state.sourceWatermarks = state.nextWatermarks || state.sourceWatermarks || {};
      state.pageIndex = 0;
      state.recordIndex = 0;
      await writeJson(STATE_PATH, state);
      return { ok: true, status: 'metadata-complete', pages: state.pagePaths.length };
    }
    const source = sources[state.sourceIndex];
    const watermark = state.incremental ? state.sourceWatermarks?.[source] : undefined;
    const requestUrl = state.nextUrl || (watermark
      ? 'https://api.mlsgrid.com/v2/Property?' + new URLSearchParams({
          '$filter': "OriginatingSystemName eq '" + source + "' and MlgCanView eq true and StandardStatus in ('Active','Pending') and ModificationTimestamp gt " + watermark,
          '$top': '5000'
        }).toString()
      : undefined);
    const page = await fetchMLSGridPage(source, requestUrl, false);
    const records = page.value || [];
    const nextWatermarks = { ...(state.nextWatermarks || state.sourceWatermarks || {}) };
    for (const record of records) {
      const modified = String(record.ModificationTimestamp || '');
      if (modified && (!nextWatermarks[source] || Date.parse(modified) > Date.parse(nextWatermarks[source]))) nextWatermarks[source] = modified;
    }
    state.nextWatermarks = nextWatermarks;
    const stagedRecords: StagedRecord[] = records.filter(inServiceArea).map(record => ({ source, record }));
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
    if (state.priorityVersion !== 2) {
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
          if (ap.date !== bp.date) return bp.date - ap.date;
          return 0;
        });
        stagedPage.records = paired.map(item => item.record);
        stagedPage.processed = paired.map(item => item.processed);
        await writeJson(stagedPath, stagedPage);
      }
      state.pageIndex = 0;
      state.recordIndex = 0;
      state.prioritySorted = true;
      state.priorityVersion = 2;
      await writeJson(STATE_PATH, state);
      console.log('MLS sync prioritized local listings for preview images', { pages: state.pagePaths.length });
    }
    // Publish any batches completed by an earlier deployment before starting
    // another batch. Previously, the public listing cache stayed stale until
    // the entire multi-hour initial scan completed, leaving expired MLS media
    // URLs in use even when newer preview images had already been downloaded.
    if (!state.cacheSeeded || !state.indexSeeded) {
      let seededCount = 0;
      for (const stagedPath of state.pagePaths) {
        const stagedPage = await readJson<StagePage>(stagedPath);
        if (!stagedPage) continue;
        for (let index = 0; index < stagedPage.records.length; index++) {
          const staged = stagedPage.records[index];
          const processed = stagedPage.processed[index];
          const listing = processed || normalizeMLSGridProperty(staged.record, staged.source);
          if (!processed) {
            const existing = existingById.get(listing.ListingId);
            if (existing?.ModificationTimestamp && existing.ModificationTimestamp === listing.ModificationTimestamp) {
              listing.Media = existing.Media || [];
            } else {
              // Publish the complete searchable listing index immediately.
              // Photos are filled in by the slower, rate-limited media batches.
              listing.Media = [];
            }
          }
          publishedById.set(listing.ListingId, listing);
          seededCount++;
        }
      }
      if (seededCount > 0) {
        await writeMLSCache(dedupeListings([...publishedById.values()]));
      }
      state.cacheSeeded = true;
      state.indexSeeded = true;
      await writeJson(STATE_PATH, state);
      console.log('MLS sync published complete searchable index before media processing', { seededCount });
    }

    if (state.pageIndex >= state.pagePaths.length) {
      const allListings: RESOProperty[] = [];
      for (const path of state.pagePaths) {
        const page = await readJson<StagePage>(path);
        if (page) allListings.push(...page.processed.filter((item): item is RESOProperty => Boolean(item)));
      }
      const mergedListings = new Map(existingById);
      if (state.incremental) {
        for (const listing of allListings) mergedListings.set(listing.ListingId, listing);
      } else {
        mergedListings.clear();
        for (const listing of allListings) mergedListings.set(listing.ListingId, listing);
      }
      const listings = dedupeListings([...mergedListings.values()]);
      await writeMLSCache(listings);
      const completedAt = new Date().toISOString();
      const pathsToDelete = state.pagePaths;
      await writeJson(STATE_PATH, {
        ...state, phase: 'idle', lastCompletedAt: completedAt,
        sourceWatermarks: state.nextWatermarks || state.sourceWatermarks || {},
        pagePaths: [], pageIndex: 0, recordIndex: 0, incremental: true
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
