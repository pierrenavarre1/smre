import { NextRequest, NextResponse } from 'next/server';
import { getListings, compareListingPriority } from '../../lib/listings';
import type { RESOProperty } from '../../lib/mock-properties';

export const dynamic = 'force-dynamic';

const normalizeSearch = (value: string) => value.toLowerCase()
  .replace(/\b(northwest|northeast|southwest|southeast|north|south|east|west|nw|ne|sw|se)\b/g, '')
  .replace(/[^a-z0-9]/g, '');
const normalizeCity = (value: string) => value.toLowerCase().replace(/[.'’,-]/g, ' ').replace(/\s+/g, ' ').trim();
const cityMatches = (city: string, requested: string) => {
  const listing = normalizeCity(city), query = normalizeCity(requested);
  if (query === 'st marys' || query === 'saint marys') return listing === 'st marys' || listing === 'saint marys';
  return listing.includes(query);
};
function matches(p: RESOProperty, q: URLSearchParams) {
  const types = q.getAll('type'), status = q.get('status') || '';
  const beds = Number(q.get('beds') || 0), baths = Number(q.get('baths') || 0);
  const max = Number(q.get('max') || 0), acreage = Number(q.get('acreage') || 0);
  const city = q.get('city') || '', address = q.get('address') || '';
  const totalBaths = (p.BathroomsTotalInteger || p.BathroomsFull || 0) + (p.BathroomsHalf ? 0.5 : 0);
  const fullAddress = normalizeSearch(`${p.StreetNumber} ${p.StreetName} ${p.City} ${p.StateOrProvince} ${p.PostalCode}`);
  return (!types.length || types.includes(p.PropertyType)) && (!status || p.StandardStatus === status)
    && (!beds || p.BedroomsTotal >= beds) && (!baths || totalBaths >= baths)
    && (!max || p.ListPrice <= max) && (!acreage || (p.LotSizeAcres || 0) >= acreage)
    && (!city || cityMatches(p.City, city) || p.PostalCode.includes(city.trim()))
    && (!address || fullAddress.includes(normalizeSearch(address)));
}
function inBounds(p: RESOProperty, q: URLSearchParams) {
  const keys = ['minLat', 'maxLat', 'minLon', 'maxLon'];
  if (!keys.every(k => q.has(k))) return true;
  const [minLat, maxLat, minLon, maxLon] = keys.map(k => Number(q.get(k)));
  return Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude)
    && p.Latitude >= minLat && p.Latitude <= maxLat && p.Longitude >= minLon && p.Longitude <= maxLon;
}
function sortItems(items: RESOProperty[], sort: string) {
  return items.sort((a, b) => {
    if (sort === 'price-desc') return b.ListPrice - a.ListPrice;
    if (sort === 'price-asc') return a.ListPrice - b.ListPrice;
    if (sort === 'newest') {
      const ad = Date.parse(a.ListingDate || a.ModificationTimestamp || '');
      const bd = Date.parse(b.ListingDate || b.ModificationTimestamp || '');
      return (Number.isFinite(bd) ? bd : 0) - (Number.isFinite(ad) ? ad : 0);
    }
    return compareListingPriority(a, b);
  });
}
function toIndex(p: RESOProperty) {
  const preview = p.Media.find(photo => photo.PreferredPhoto) || p.Media[0];
  return {
    ListingId: p.ListingId, StandardStatus: p.StandardStatus, ListPrice: p.ListPrice,
    BedroomsTotal: p.BedroomsTotal, BathroomsTotalInteger: p.BathroomsTotalInteger,
    BathroomsFull: p.BathroomsFull, BathroomsHalf: p.BathroomsHalf, PropertyType: p.PropertyType,
    StreetNumber: p.StreetNumber, StreetName: p.StreetName, City: p.City,
    StateOrProvince: p.StateOrProvince, PostalCode: p.PostalCode, LivingArea: p.LivingArea,
    LotSizeAcres: p.LotSizeAcres, LotSizeSqFt: p.LotSizeSqFt, Media: preview ? [preview] : [],
    ListOfficeName: p.ListOfficeName, MlsSource: p.MlsSource, Latitude: p.Latitude,
    Longitude: p.Longitude, ListingDate: p.ListingDate, ModificationTimestamp: p.ModificationTimestamp,
  };
}
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams, all = await getListings(), mode = q.get('mode') || 'page';
  if (mode === 'suggest') {
    const query = normalizeSearch(q.get('q') || '');
    if (!query) return NextResponse.json({ items: [] });
    const items = all.filter(p => normalizeSearch(`${p.StreetNumber} ${p.StreetName} ${p.City} ${p.StateOrProvince} ${p.PostalCode}`).includes(query))
      .slice(0, 6).map(p => ({ ListingId:p.ListingId, StreetNumber:p.StreetNumber, StreetName:p.StreetName, City:p.City, StateOrProvince:p.StateOrProvince, PostalCode:p.PostalCode }));
    return NextResponse.json({ items }, { headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'} });
  }
  const filtered = all.filter(p => matches(p, q));
  if (mode === 'map') {
    const items = filtered.filter(p => inBounds(p, q)).map(p => {
      const v = toIndex(p);
      return { ListingId:v.ListingId, ListPrice:v.ListPrice, BedroomsTotal:v.BedroomsTotal,
        BathroomsTotalInteger:v.BathroomsTotalInteger, StreetNumber:v.StreetNumber, StreetName:v.StreetName,
        City:v.City, StateOrProvince:v.StateOrProvince, LivingArea:v.LivingArea, Media:v.Media,
        Latitude:v.Latitude, Longitude:v.Longitude };
    });
    return NextResponse.json({ items }, { headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'} });
  }
  const sorted = sortItems(filtered.filter(p => inBounds(p, q)), q.get('sort') || 'priority');
  const page = Math.max(1, Number(q.get('page') || 1)), limit = Math.min(48, Math.max(1, Number(q.get('limit') || 24)));
  const start = (page - 1) * limit;
  return NextResponse.json({ items:sorted.slice(start,start+limit).map(toIndex), total:sorted.length, page,
    pageCount:Math.max(1,Math.ceil(sorted.length/limit)) }, { headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'} });
}
