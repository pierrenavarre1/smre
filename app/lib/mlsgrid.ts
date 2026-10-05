import type { RESOProperty, PropertyType, MLSSource } from './mock-properties';

const API_BASE = process.env.MLSGRID_API_BASE_URL || 'https://api.mlsgrid.com/v2';
const ORIGINATING_SYSTEM = process.env.MLSGRID_ORIGINATING_SYSTEM || 'sunflower';

type MlsGridRecord = Record<string, any>;
type MlsGridResponse = { value?: MlsGridRecord[]; '@odata.nextLink'?: string };

function asNumber(value: unknown, fallback = 0) { const n = typeof value === 'number' ? value : Number(value); return Number.isFinite(n) ? n : fallback; }
function firstString(...values: unknown[]) { return values.find(v => typeof v === 'string' && v.trim()) as string | undefined; }
function propertyType(value: unknown): PropertyType { const v = String(value || '').toLowerCase(); if (v.includes('farm')) return 'Farm'; if (v.includes('land')) return 'Land'; if (v.includes('commercial')) return 'Commercial'; return 'Residential'; }
function media(record: MlsGridRecord) { const items = Array.isArray(record.Media) ? record.Media : []; return items.filter((m: any) => m?.MediaURL).map((m: any) => ({ MediaKey: String(m.MediaKey || ''), MediaURL: String(m.MediaURL), MediaCategory: 'Photo' as const, ShortDescription: firstString(m.ShortDescription) })); }

export function isMLSGridConfigured() { return Boolean(process.env.MLSGRID_ACCESS_TOKEN); }

export async function fetchMLSGridPage(url?: string): Promise<MlsGridResponse> {
  const token = process.env.MLSGRID_ACCESS_TOKEN;
  if (!token) throw new Error('MLSGRID_ACCESS_TOKEN is not configured.');
  const endpoint = url || API_BASE + '/Property?' + new URLSearchParams({ '$filter': `OriginatingSystemName eq '${ORIGINATING_SYSTEM}' and MlgCanView eq true`, '$expand': 'Media', '$top': '1000' }).toString();
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Accept-Encoding': 'gzip' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`MLS Grid request failed: ${response.status} ${response.statusText}`);
  return response.json();
}

export function normalizeMLSGridProperty(record: MlsGridRecord): RESOProperty {
  const listPrice = asNumber(record.ListPrice);
  const livingArea = asNumber(record.LivingArea || record.LivingAreaTotal);
  const lotSqFt = asNumber(record.LotSizeSquareFeet || record.LotSizeSquareFeetTotal);
  return {
    ListingId: String(record.ListingId || record.ListingKey || ''), ListingKey: String(record.ListingKey || record.ListingId || ''),
    StandardStatus: ['Pending','Closed'].includes(String(record.StandardStatus)) ? String(record.StandardStatus) as RESOProperty['StandardStatus'] : 'Active',
    ListPrice: listPrice, BedroomsTotal: asNumber(record.BedroomsTotal), BathroomsTotalInteger: asNumber(record.BathroomsTotalInteger || record.BathroomsTotal), BathroomsFull: asNumber(record.BathroomsFull), BathroomsHalf: asNumber(record.BathroomsHalf),
    PropertyType: propertyType(record.PropertyType), PropertySubType: firstString(record.PropertySubType) || '', StreetNumber: firstString(record.StreetNumber) || '', StreetName: firstString(record.StreetName) || '', City: firstString(record.City) || '', StateOrProvince: firstString(record.StateOrProvince) || 'KS', PostalCode: firstString(record.PostalCode) || '',
    LivingArea: livingArea, LotSizeAcres: asNumber(record.LotSizeAcres || (lotSqFt ? lotSqFt / 43560 : 0)), LotSizeSqFt: lotSqFt || undefined, YearBuilt: asNumber(record.YearBuilt), PublicRemarks: firstString(record.PublicRemarks) || '', Media: media(record),
    ListAgentFullName: firstString(record.ListAgentFullName) || '', ListAgentMlsId: firstString(record.ListAgentMlsId) || '', ListOfficeName: firstString(record.ListOfficeName) || '', MlsSource: 'Sunflower MLS' as MLSSource, Latitude: asNumber(record.Latitude), Longitude: asNumber(record.Longitude),
    PricePerSqFt: asNumber(record.PricePerSquareFoot || (livingArea ? listPrice / livingArea : 0)) || undefined, AnnualTaxes: asNumber(record.TaxAnnualAmount) || undefined, TaxYear: asNumber(record.TaxYear) || undefined, GarageSpaces: asNumber(record.GarageSpaces) || undefined,
    ParkingFeatures: Array.isArray(record.ParkingFeatures) ? record.ParkingFeatures.join(', ') : firstString(record.ParkingFeatures), Basement: Array.isArray(record.Basement) ? record.Basement.join(', ') : firstString(record.Basement), Foundation: Array.isArray(record.FoundationDetails) ? record.FoundationDetails.join(', ') : firstString(record.FoundationDetails), Roof: Array.isArray(record.Roof) ? record.Roof.join(', ') : firstString(record.Roof), Exterior: Array.isArray(record.ExteriorFeatures) ? record.ExteriorFeatures.join(', ') : firstString(record.ExteriorFeatures), Flooring: Array.isArray(record.Flooring) ? record.Flooring.join(', ') : firstString(record.Flooring), Appliances: Array.isArray(record.Appliances) ? record.Appliances.join(', ') : firstString(record.Appliances), Heating: Array.isArray(record.Heating) ? record.Heating.join(', ') : firstString(record.Heating), Cooling: Array.isArray(record.Cooling) ? record.Cooling.join(', ') : firstString(record.Cooling), WaterSource: Array.isArray(record.WaterSource) ? record.WaterSource.join(', ') : firstString(record.WaterSource), Sewer: Array.isArray(record.Sewer) ? record.Sewer.join(', ') : firstString(record.Sewer),
    HOA: firstString(record.AssociationName), Schools: Array.isArray(record.SchoolDistrict) ? record.SchoolDistrict.join(', ') : firstString(record.SchoolDistrict), Directions: firstString(record.Directions), ArchitecturalStyle: Array.isArray(record.ArchitecturalStyle) ? record.ArchitecturalStyle.join(', ') : firstString(record.ArchitecturalStyle), ListingDate: firstString(record.OriginalEntryTimestamp, record.OnMarketDate), MLSNumber: firstString(record.ListingId), ParcelNumber: firstString(record.ParcelNumber), OtherStructures: Array.isArray(record.OtherStructures) ? record.OtherStructures.join(', ') : firstString(record.OtherStructures), Features: Array.isArray(record.InteriorFeatures) ? record.InteriorFeatures : undefined
  };
}