'use client';

type FubProperty = {
  street: string;
  city: string;
  state: string;
  code?: string;
  mlsNumber?: string;
  price?: number;
  url: string;
};

export function sendFubPropertyView(property: FubProperty) {
  if (typeof window === 'undefined') return;
  void fetch('/api/fub/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    keepalive: true,
    body: JSON.stringify({ type: 'Viewed Property', property }),
  }).catch(() => {});
}

export function sendFubPropertySearch(search: {
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  criteria?: string;
  url?: string;
}) {
  if (typeof window === 'undefined') return;
  void fetch('/api/fub/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    keepalive: true,
    body: JSON.stringify({ type: 'Property Search', propertySearch: search, url: search.url || window.location.href }),
  }).catch(() => {});
}
