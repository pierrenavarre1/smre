import { get, put } from '@vercel/blob';
import type { RESOProperty, RESOMedia } from './mock-properties';
import { fetchMLSGridPage, normalizeMLSGridProperty, dedupeListings } from './mlsgrid';
import { readMLSCache, writeMLSCache } from './mls-store';

type MlsGridRecord = Record<string, any>;

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

const MIN_REQUEST_INTERVAL_MS = 800;
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

function normalizeCity(value: unknown) {
  return String(value || '').toLowerCase().replace(/[.'’,-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function inServiceArea(record: MlsGridRecord) {
  return SERVICE_CITIES.has(normalizeCity(record.City));
}

async function waitForSlot() {
  const slot = requestQueue.then(async () => {
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
  });
  requestQueue = slot.catch(() => undefined);
  await slot;
}

function sourceKeys() {
  const configured = (process.env.MLSGRID_ORIGINATING_SYSTEMS || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  return configured.length
    ? configured.filter(source => source === 'sunflower' || source === 'flinthills')
    : ['sunflower', 'flinthills'];
}

function sourceToken() {
  return process.env.MLSGRID_ACCESS_TOKEN;
}

function media(record: MlsGridRecord): RESOMedia[] {
  const items = Array.isArray(record.Media) ? record.Media : [];
  return items
    .filter((m: any) => m?.MediaURL && (!m.MediaCategory || String(m.MediaCategory).toLowerCase() === 'photo'))
    .map((m: any, index: number) => ({
      MediaKey: String(m.MediaKey || `${record.ListingKey || record.ListingId || 'media'}-${index}`),
      MediaURL: String(m.MediaURL).replace(/^http:/i, 'https:'),
      MediaCategory: 'Photo' as const,
      ShortDescription: typeof m.ShortDescription === 'string' ? m.ShortDescription : undefined,
      PreferredPhoto: m.PreferredPhoto === true || m.PreferredPhotoYN === true || String(m.PreferredPhotoYN).toLowerCase() === 'true',
      MediaOrder: Number.isFinite(Number(m.MediaOrder)) ? Number(m.MediaOrder) : (Number.isFinite(Number(m.Order)) ? Number(m.Order) : index)
    }))
    .sort((a, b) => a.MediaOrder - b.MediaOrder);
}

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

function listingId(source: string, record: MlsGridRecord) {
  return source + ':' + String(record.ListingId || record.ListingKey || '');
}

async function fetchAllMetadata(source: string) {
  const records: MlsGridRecord[] = [];
  let url: string | undefined;

  do {
    const page = await fetchMLSGridPage(source, url, false);
    records.push(...(page.value || []));
    url = page['@odata.nextLink'];
  } while (url);

  return records.filter(inServiceArea);
}

async function fetchMediaForChangedListings(source: string, records: MlsGridRecord[]) {
  const ids = records
    .map(record => String(record.ListingId || record.ListingKey || ''))
    .filter(Boolean);

  const byId = new Map<string, MlsGridRecord>();
  for (const record of records) {
    const id = String(record.ListingId || record.ListingKey || '');
    if (id) byId.set(id, record);
  }

  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const values = batch.map(id => "'" + id.replace(/'/g, "''") + "'").join(',');
    const filter =
      "OriginatingSystemName eq '" + source +
      "' and MlgCanView eq true and ListingId in (" + values + ")";

    const page = await fetchMLSGridPage(
      source,
      'https://api.mlsgrid.com/v2/Property?' + new URLSearchParams({
        '$filter': filter,
        '$expand': 'Media',
        '$top': '100'
      }).toString(),
      true
    );

    for (const record of page.value || []) {
      const id = String(record.ListingId || record.ListingKey || '');
      const target = byId.get(id);
      if (target) target.Media = record.Media;
    }
  }

  return records;
}

async function downloadPreview(source: string, record: MlsGridRecord, existing: RESOProperty | undefined) {
  const photos = media(record);
  const preview = photos.find(photo => photo.PreferredPhoto) || photos[0];
  if (!preview) {
    record.Media = [];
    return;
  }

  const oldPreview = existing?.Media?.find(photo => photo.PreferredPhoto) || existing?.Media?.[0];

  if (oldPreview?.MediaURL?.startsWith('smre-blob:') && oldPreview.MediaKey === preview.MediaKey) {
    const oldKey = oldPreview.MediaURL.slice('smre-blob:'.length);
    try {
      const stored = await get('mls/images/' + oldKey + '.image', { access: 'private', useCache: false });
      if (stored?.statusCode === 200 && stored.stream) {
        await stored.stream.cancel();
        record.Media = [{ ...preview, MediaURL: oldPreview.MediaURL }];
        return;
      }
    } catch {
      // The local image is missing. Download it again below.
    }
  }

  const token = sourceToken();
  if (!token) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await waitForSlot();
      const response = await fetch(preview.MediaURL, {
        headers: {
          Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*',
          'User-Agent': token
        },
        redirect: 'follow',
        cache: 'no-store',
        signal: AbortSignal.timeout(12000)
      });

      if (response.status === 429 && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }
      if (!response.ok || !response.body) {
        throw new Error('MLS image download failed: ' + response.status + ' ' + response.statusText);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      if (!contentType.toLowerCase().startsWith('image/')) {
        throw new Error('MLS media URL returned non-image content.');
      }

      const key = mediaStorageKey(source + ':' + preview.MediaKey);
      await put('mls/images/' + key + '.image', await response.arrayBuffer(), {
        access: 'private',
        allowOverwrite: true,
        cacheControlMaxAge: 31536000,
        contentType
      });

      record.Media = [{ ...preview, MediaURL: 'smre-blob:' + key }];
      return;
    } catch (error) {
      if (attempt === 2) {
        console.error('MLS preview image failed for ' + listingId(source, record) + ':', error instanceof Error ? error.message : error);
        record.Media = [];
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

export async function runIncrementalMLSGridSync() {
  if (!sourceToken()) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');

  const existingListings = await readMLSCache();
  const existingById = new Map(existingListings.map(listing => [listing.ListingId, listing]));
  const all: RESOProperty[] = [];

  for (const source of sourceKeys()) {
    if (!sourceToken()) continue;

    const records = await fetchAllMetadata(source);
    const changed: MlsGridRecord[] = [];

    for (const record of records) {
      const id = listingId(source, record);
      const existing = existingById.get(id);
      const modification = String(record.ModificationTimestamp || '');
      if (!existing || existing.ModificationTimestamp !== modification || !existing.Media?.length) {
        changed.push(record);
      } else {
        record.Media = existing.Media;
      }
    }

    console.log('MLS incremental sync', {
      source,
      activeListings: records.length,
      changedListings: changed.length
    });

    if (changed.length) {
      await fetchMediaForChangedListings(source, changed);
      for (const record of changed) {
        await downloadPreview(source, record, existingById.get(listingId(source, record)));
      }
    }

    for (const record of records) {
      all.push(normalizeMLSGridProperty(record, source));
    }
  }

  const listings = dedupeListings(all);
  await writeMLSCache(listings);

  return {
    count: listings.length,
    updatedAt: new Date().toISOString()
  };
}
