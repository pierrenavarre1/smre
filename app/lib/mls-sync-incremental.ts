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
  startedAt: string;
};

const STATE_PATH = 'mls/sync-state.json';
const STAGING_ROOT = 'mls/sync-staging';
const DAILY_INTERVAL_MS = 23 * 60 * 60 * 1000;
const RECORDS_PER_INVOCATION = 30;
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
      MediaURL: String(item.MediaURL).replace(/^http:/i, 'https:'),
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
  const token = process.env.MLSGRID_ACCESS_TOKEN;
  if (!token) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');
  const key = storageKey(source, preview.MediaKey);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await waitForMLSGridSlot();
      const response = await fetch(preview.MediaURL, {
        headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*', 'User-Agent': token },
        redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000)
      });
      if (response.status === 429 && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }
      if (!response.ok || !response.body) throw new Error('MLS image download failed: ' + response.status + ' ' + response.statusText);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      if (!contentType.toLowerCase().startsWith('image/')) throw new Error('MLS media URL returned non-image content.');
      await put('mls/images/' + key + '.image', await response.arrayBuffer(), {
        access: 'private', allowOverwrite: true, cacheControlMaxAge: 31536000, contentType
      });
      record.Media = [{ ...preview, MediaURL: 'smre-blob:' + key }];
      return;
    } catch (error) {
      if (attempt === 2) {
        console.error('MLS preview image failed for ' + source + ':' + String(record.ListingId || record.ListingKey || ''), error instanceof Error ? error.message : error);
        record.Media = [];
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}
async function fetchMediaForChangedRecords(source: string, records: MlsGridRecord[]) {
  if (!records.length) return;
  const ids = records.map(record => String(record.ListingId || record.ListingKey || '')).filter(Boolean);
  if (!ids.length) return;
  const values = ids.map(id => "'" + id.replace(/'/g, "''") + "'").join(',');
  const filter = "OriginatingSystemName eq '" + source + "' and MlgCanView eq true and ListingId in (" + values + ")";
  const page = await fetchMLSGridPage(source, 'https://api.mlsgrid.com/v2/Property?' + new URLSearchParams({
    '$filter': filter, '$expand': 'Media', '$top': String(Math.max(100, ids.length))
  }).toString(), true);
  const mediaById = new Map<string, any[]>();
  for (const item of page.value || []) {
    const id = String(item.ListingId || item.ListingKey || '');
    if (id) mediaById.set(id, Array.isArray(item.Media) ? item.Media : []);
  }
  for (const record of records) {
    const id = String(record.ListingId || record.ListingKey || '');
    record.Media = mediaById.get(id) || [];
  }
}
async function processBatch(records: StagedRecord[], existingById: Map<string, RESOProperty>) {
  const refreshBySource = new Map<string, MlsGridRecord[]>();
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
      const group = refreshBySource.get(item.source) || [];
      group.push(record);
      refreshBySource.set(item.source, group);
    }
  }
  for (const [source, changed] of refreshBySource) {
    await fetchMediaForChangedRecords(source, changed);
    for (const record of changed) await downloadPreview(source, record);
  }
  return records.map(item => {
    const id = item.source + ':' + String(item.record.ListingId || item.record.ListingKey || '');
    const normalized = normalizeMLSGridProperty(item.record, item.source);
    const existing = existingById.get(id);
    if (!normalized.Media.length && existing?.Media.length) {
      const preview = existing.Media.find(photo => photo.PreferredPhoto) || existing.Media[0];
      // Keep the prior preview as a fallback only if the listing metadata is unchanged
      // and the stored image is still present.
      if (String(existing.ModificationTimestamp || '') === String(item.record.ModificationTimestamp || '') &&
          preview && await imageExists(preview.MediaURL)) normalized.Media = [preview];
    }
    return normalized;
  });
}
export async function runIncrementalMLSGridSync() {
  if (!tokenConfigured()) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');
  let state = await loadState();
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
    return { ok: true, status: 'metadata-page-saved', source, records: stagedRecords.length, pagesSaved: state.pagePaths.length };
  }

  if (state.phase === 'media') {
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
      try { await del(pathsToDelete, { access: 'private' }); }
      catch (error) { console.warn('Could not clean MLS staging files:', error instanceof Error ? error.message : error); }
      console.log('MLS incremental sync completed', { listings: listings.length, durationMs: Date.now() - Date.parse(state.startedAt) });
      return { ok: true, status: 'completed', listings: listings.length, updatedAt: completedAt };
    }
    const path = state.pagePaths[state.pageIndex];
    const page = await readJson<StagePage>(path);
    if (!page) throw new Error('MLS sync staging page is missing: ' + path);
    const end = Math.min(page.records.length, state.recordIndex + RECORDS_PER_INVOCATION);
    const batch = page.records.slice(state.recordIndex, end);
    const processed = await processBatch(batch, existingById);
    for (let i = 0; i < processed.length; i++) page.processed[state.recordIndex + i] = processed[i];
    await writeJson(path, page);
    state.recordIndex = end;
    if (state.recordIndex >= page.records.length) { state.pageIndex++; state.recordIndex = 0; }
    await writeJson(STATE_PATH, state);
    return { ok: true, status: 'media-batch-saved', processed: processed.length, page: state.pageIndex + 1, pages: state.pagePaths.length, complete: state.pageIndex >= state.pagePaths.length };
  }
  return { ok: true, status: state.phase };
}
