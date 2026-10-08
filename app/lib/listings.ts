import { mockProperties, getMockProperty, type RESOProperty } from './mock-properties';
import { readMLSCache } from './mls-store';

export async function getListings(): Promise<RESOProperty[]> {
  const listings = await readMLSCache();
  if (listings.length) return listings;
  return process.env.NODE_ENV === 'development' ? mockProperties : [];
}

export async function getListing(id: string): Promise<RESOProperty | undefined> {
  const decodedId = decodeURIComponent(id);
  const listings = await getListings();
  if (listings.length) return listings.find(p => p.ListingId === decodedId || p.ListingKey === decodedId);
  return process.env.NODE_ENV === 'development' ? getMockProperty(decodedId) : undefined;
}

export type ListingFilters = { minPrice?:number; maxPrice?:number; beds?:number; propertyType?:string; source?:string; status?:string; sort?:string; };

const localCities = new Set(['st marys', 'saint marys', 'wamego']);

function normalizeCity(value: string) {
  return value.toLowerCase().replace(/[.'’,-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function listingTimestamp(p: RESOProperty) {
  const value = p.ListingDate || p.ModificationTimestamp;
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function isSMRE(p: RESOProperty) {
  return /st\.?\s*mary['’]?s\s*real\s*estate/i.test(p.ListOfficeName || '');
}

export function compareListingPriority(a: RESOProperty, b: RESOProperty) {
  const aSMRE = isSMRE(a);
  const bSMRE = isSMRE(b);
  if (aSMRE !== bSMRE) return aSMRE ? -1 : 1;

  const aLocal = localCities.has(normalizeCity(a.City));
  const bLocal = localCities.has(normalizeCity(b.City));
  if (aLocal !== bLocal) return aLocal ? -1 : 1;

  return listingTimestamp(b) - listingTimestamp(a);
}

export function sortListingsByPriority(items: RESOProperty[]) {
  return [...items].sort(compareListingPriority);
}

export function filterListings(items: RESOProperty[], f: ListingFilters){
  const out=items.filter(p=>(!f.minPrice||p.ListPrice>=f.minPrice)&&(!f.maxPrice||p.ListPrice<=f.maxPrice)&&(!f.beds||p.BedroomsTotal>=f.beds)&&(!f.propertyType||p.PropertyType===f.propertyType)&&(!f.source||p.MlsSource===f.source)&&(!f.status||p.StandardStatus===f.status));
  return out.sort((a,b)=>f.sort==='price-asc'?a.ListPrice-b.ListPrice:f.sort==='price-desc'?b.ListPrice-a.ListPrice:compareListingPriority(a,b));
}
