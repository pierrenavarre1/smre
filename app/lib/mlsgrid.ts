import type { RESOProperty, RESOMedia, PropertyType, MLSSource } from './mock-properties';
import { get, put } from '@vercel/blob';
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
      MediaURL: String(m.MediaURL).replace(/^http:/i, 'https:'),
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

const MIN_REQUEST_INTERVAL_MS = 1500;
let lastRequestAt = 0;
let mlsGridRequestQueue: Promise<void> = Promise.resolve();

export async function waitForMLSGridSlot() {
  const slot = mlsGridRequestQueue.then(async () => {
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
  });
  mlsGridRequestQueue = slot.catch(() => undefined);
  await slot;
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
    throw new Error('MLS Grid request failed for ' + source + ': ' + response.status + ' ' + response.statusText);
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

  // A stored image key cannot be repaired by querying MLS Grid during a page
  // request. Doing so once per image/gallery creates an RPS burst and reuses
  // single-use media URLs. Wait for storage/scheduled sync to repair the cache.
  const hasBlobPlaceholder = listing.Media.some(photo => photo.MediaURL.startsWith('smre-blob:'));
  if (hasBlobPlaceholder) return [];

  // Reuse media already available from the live feed or a healthy local cache.
  if (listing.Media.length && !hasBlobPlaceholder) {
    freshMediaCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: listing.Media });
    const preferred = listing.Media.find(photo => photo.PreferredPhoto) || listing.Media[0];
    freshPreviewCache.set(listing.ListingId, { expiresAt: Date.now() + FRESH_MEDIA_CACHE_MS, media: preferred ? [preferred] : [] });
    return listing.Media;
  }

  // Do not fall back to live API requests during page rendering. The next
  // scheduled sync will refresh the saved media set.
  return [];
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
  return record ? normalizeMLSGridProperty(record, source) : undefined;
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

export function normalizeMLSGridProperty(record: MlsGridRecord, source = 'sunflower'): RESOProperty {
  const listPrice = asNumber(record.ListPrice);
  const livingArea = asNumber(record.LivingArea || record.LivingAreaTotal);
  const lotSqFt = asNumber(record.LotSizeSquareFeet || record.LotSizeSquareFeetTotal);
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
    BathroomsTotalInteger: asNumber(record.BathroomsTotalInteger || record.BathroomsTotal),
    BathroomsFull: asNumber(record.BathroomsFull),
    BathroomsHalf: asNumber(record.BathroomsHalf),
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
    ListAgentFullName: firstString(record.ListAgentFullName) || '',
    ListAgentMlsId: firstString(record.ListAgentMlsId) || '',
    ListOfficeName: firstString(record.ListOfficeName) || '',
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
