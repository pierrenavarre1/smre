import type { RESOProperty, PropertyType, MLSSource } from './mock-properties';

const API_BASE = process.env.MLSGRID_API_BASE_URL || 'https://api.mlsgrid.com/v2';
const DEFAULT_SOURCES = ['sunflower'] as const;
const SOURCE_CONFIG: Record<string, { label: MLSSource }> = {
  flinthills: { label: 'FHAR MLS' },
  sunflower: { label: 'Sunflower MLS' },
};

type MlsGridRecord = Record<string, any>;
type MlsGridResponse = { value?: MlsGridRecord[]; '@odata.nextLink'?: string };

function asNumber(value: unknown, fallback = 0) { const n = typeof value === 'number' ? value : Number(value); return Number.isFinite(n) ? n : fallback; }
function firstString(...values: unknown[]) { return values.find(v => typeof v === 'string' && v.trim()) as string | undefined; }
function propertyType(value: unknown): PropertyType { const v = String(value || '').toLowerCase(); if (v.includes('farm')) return 'Farm'; if (v.includes('land')) return 'Land'; if (v.includes('commercial')) return 'Commercial'; return 'Residential'; }
function media(record: MlsGridRecord) { const items = Array.isArray(record.Media) ? record.Media : []; return items.filter((m: any) => m?.MediaURL).map((m: any) => ({ MediaKey: String(m.MediaKey || ''), MediaURL: String(m.MediaURL), MediaCategory: 'Photo' as const, ShortDescription: firstString(m.ShortDescription) })); }
function sourceKeys() {
  const configured = (process.env.MLSGRID_ORIGINATING_SYSTEMS || '').split(',').map(v => v.trim()).filter(Boolean);
  return configured.length ? configured : [...DEFAULT_SOURCES];
}
function sourceLabel(source: string): MLSSource { return SOURCE_CONFIG[source]?.label || (source === 'sunflower' ? 'Sunflower MLS' : 'FHAR MLS'); }

export function isMLSGridConfigured() { return Boolean(process.env.MLSGRID_ACCESS_TOKEN); }

export async function fetchMLSGridPage(source: string, url?: string): Promise<MlsGridResponse> {
  const token = process.env.MLSGRID_ACCESS_TOKEN;
  if (!token) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');
  const endpoint = url || API_BASE + '/Property?' + new URLSearchParams({
    '$filter': `OriginatingSystemName eq '${source}' and MlgCanView eq true and StandardStatus in ('Active','Pending')`,
    '$expand': 'Media',
    '$top': '100'
  }).toString();
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Accept-Encoding': 'gzip' }, next: { revalidate: 120 } });
  if (!response.ok) throw new Error(`MLS Grid request failed for ${source}: ${response.status} ${response.statusText}`);
  return response.json();
}

export async function fetchMLSGridListings(): Promise<RESOProperty[]> {
  const all: RESOProperty[] = [];
  for (const source of sourceKeys()) {
    try {
      const page = await fetchMLSGridPage(source);
      for (const record of page.value || []) all.push(normalizeMLSGridProperty(record, source));
    } catch (error) {
      console.error(`MLS Grid source failed for ${source}:`, error);
    }
  }

  const seen = new Set<string>();
  return all.filter((listing) => {
    const key = listing.MLSNumber || listing.ListingKey || listing.ListingId;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeMLSGridProperty(record: MlsGridRecord, source = 'sunflower'): RESOProperty {
  const listPrice = asNumber(record.ListPrice);
  const livingArea = asNumber(record.LivingArea || record.LivingAreaTotal);
  const lotSqFt = asNumber(record.LotSizeSquareFeet || record.LotSizeSquareFeetTotal);
  const originalId = String(record.ListingId || record.ListingKey || '');
  const sourceKey = source.toLowerCase();
  const internalId = `${sourceKey}:${originalId}`;
  return {
    ListingId: internalId, ListingKey: String(record.ListingKey || originalId), StandardStatus: ['Pending','Closed'].includes(String(record.StandardStatus)) ? String(record.StandardStatus) as RESOProperty['StandardStatus'] : 'Active',
    ListPrice: listPrice, BedroomsTotal: asNumber(record.BedroomsTotal), BathroomsTotalInteger: asNumber(record.BathroomsTotalInteger || record.BathroomsTotal), BathroomsFull: asNumber(record.BathroomsFull), BathroomsHalf: asNumber(record.BathroomsHalf),
    PropertyType: propertyType(record.PropertyType), PropertySubType: firstString(record.PropertySubType) || '', StreetNumber: firstString(record.StreetNumber) || '', StreetName: firstString(record.StreetName) || '', City: firstString(record.City) || '', StateOrProvince: firstString(record.StateOrProvince) || 'KS', PostalCode: firstString(record.PostalCode) || '',
    LivingArea: livingArea, LotSizeAcres: asNumber(record.LotSizeAcres || (lotSqFt ? lotSqFt / 43560 : 0)), LotSizeSqFt: lotSqFt || undefined, YearBuilt: asNumber(record.YearBuilt), PublicRemarks: firstString(record.PublicRemarks) || '', Media: media(record),
    ListAgentFullName: firstString(record.ListAgentFullName) || '', ListAgentMlsId: firstString(record.ListAgentMlsId) || '', ListOfficeName: firstString(record.ListOfficeName) || '', MlsSource: sourceLabel(source), Latitude: asNumber(record.Latitude), Longitude: asNumber(record.Longitude),
    PricePerSqFt: asNumber(record.PricePerSquareFoot || (livingArea ? listPrice / livingArea : 0)) || undefined, AnnualTaxes: asNumber(record.TaxAnnualAmount) || undefined, TaxYear: asNumber(record.TaxYear) || undefined, GarageSpaces: asNumber(record.GarageSpaces) || undefined,
    ParkingFeatures: Array.isArray(record.ParkingFeatures) ? record.ParkingFeatures.join(', ') : firstString(record.ParkingFeatures), Basement: Array.isArray(record.Basement) ? record.Basement.join(', ') : firstString(record.Basement), Foundation: Array.isArray(record.FoundationDetails) ? record.FoundationDetails.join(', ') : firstString(record.FoundationDetails), Roof: Array.isArray(record.Roof) ? record.Roof.join(', ') : firstString(record.Roof), Exterior: Array.isArray(record.ExteriorFeatures) ? record.ExteriorFeatures.join(', ') : firstString(record.ExteriorFeatures), Flooring: Array.isArray(record.Flooring) ? record.Flooring.join(', ') : firstString(record.Flooring), Appliances: Array.isArray(record.Appliances) ? record.Appliances.join(', ') : firstString(record.Appliances), Heating: Array.isArray(record.Heating) ? record.Heating.join(', ') : firstString(record.Heating), Cooling: Array.isArray(record.Cooling) ? record.Cooling.join(', ') : firstString(record.Cooling), WaterSource: Array.isArray(record.WaterSource) ? record.WaterSource.join(', ') : firstString(record.WaterSource), Sewer: Array.isArray(record.Sewer) ? record.Sewer.join(', ') : firstString(record.Sewer),
    HOA: firstString(record.AssociationName), Schools: Array.isArray(record.SchoolDistrict) ? record.SchoolDistrict.join(', ') : firstString(record.SchoolDistrict), Directions: firstString(record.Directions), ArchitecturalStyle: Array.isArray(record.ArchitecturalStyle) ? record.ArchitecturalStyle.join(', ') : firstString(record.ArchitecturalStyle), ListingDate: firstString(record.OriginalEntryTimestamp, record.OnMarketDate), MLSNumber: firstString(record.ListingId), ParcelNumber: firstString(record.ParcelNumber), OtherStructures: Array.isArray(record.OtherStructures) ? record.OtherStructures.join(', ') : firstString(record.OtherStructures), Features: Array.isArray(record.InteriorFeatures) ? record.InteriorFeatures : undefined
  };
}
