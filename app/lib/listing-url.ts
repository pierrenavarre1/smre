import type { RESOProperty } from './mock-properties';

export function listingSlug(listing: Pick<RESOProperty, 'StreetNumber' | 'StreetName' | 'City' | 'StateOrProvince' | 'PostalCode'>) {
  const address = [listing.StreetNumber, listing.StreetName, listing.City, listing.StateOrProvince, listing.PostalCode]
    .filter(Boolean)
    .join(' ');
  return address
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function listingHref(listing: Pick<RESOProperty, 'StreetNumber' | 'StreetName' | 'City' | 'StateOrProvince' | 'PostalCode'>) {
  return '/listings/' + encodeURIComponent(listingSlug(listing));
}
