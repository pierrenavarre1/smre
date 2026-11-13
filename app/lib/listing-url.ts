import type { RESOProperty } from './mock-properties';

export function listingAddressSlug(listing: Pick<RESOProperty, 'StreetNumber' | 'StreetName' | 'City' | 'StateOrProvince'>) {
  const address = [listing.StreetNumber, listing.StreetName, listing.City, listing.StateOrProvince || 'KS']
    .filter(Boolean)
    .join(' ');
  return address
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function listingHref(listing: RESOProperty) {
  const slug = listingAddressSlug(listing);
  return `/listings/${slug || encodeURIComponent(listing.ListingId)}`;
}
