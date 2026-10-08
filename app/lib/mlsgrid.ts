import type { RESOProperty, PropertyType, MLSSource } from './mock-properties';

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
      preferred: m.PreferredPhotoYN === true || String(m.PreferredPhotoYN).toLowerCase() === 'true',
      order: Number.isFinite(Number(m.Order)) ? Number(m.Order) : index + 1
    }))
    .sort((a, b) => {
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
      return a.order - b.order;
    })
    .map(({ order: _order, preferred: _preferred, ...photo }) => photo);
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

const MIN_REQUEST_INTERVAL_MS = 650;
let lastRequestAt = 0;

async function waitForMLSGridSlot() {
  const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
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
    '$top': expandMedia ? '100' : '5000'
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

async function fetchAllPropertyRecords(source: string) {
  const records: MlsGridRecord[] = [];
  let url: string | undefined;

  do {
    const page = await fetchMLSGridPage(source, url, false);
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

export async function fetchMLSGridListings(): Promise<RESOProperty[]> {
  const all: RESOProperty[] = [];

  for (const source of sourceKeys()) {
    if (!sourceToken(source)) {
      console.warn('MLS Grid source skipped because no access token is configured for ' + source + '.');
      continue;
    }

    try {
      const records = await fetchAllPropertyRecords(source);
      const serviceAreaRecords = records.filter(isInServiceArea);
      const recordsWithMedia = await fetchMediaForRecords(source, serviceAreaRecords);

      for (const record of recordsWithMedia) {
        all.push(normalizeMLSGridProperty(record, source));
      }
    } catch (error) {
      console.error('MLS Grid source failed for ' + source + ':', error);
    }
  }

  return dedupeListings(all);
}

function normalizeAddressPart(value: string) {
  return value
    .toLowerCase()
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
