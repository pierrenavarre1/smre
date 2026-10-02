'use client';

import { useMemo, useState } from 'react';
import type { RESOProperty } from '../lib/mock-properties';

export function HomeSearch({ items }: { items: RESOProperty[] }) {
  const [address, setAddress] = useState('');
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = address.trim().toLowerCase();
    if (!q) return [];
    return items.filter((p) => {
      const full = `${p.StreetNumber} ${p.StreetName} ${p.City} ${p.StateOrProvince} ${p.PostalCode}`.toLowerCase();
      return full.includes(q);
    }).slice(0, 6);
  }, [items, address]);

  const selectedAddress = (p: RESOProperty) =>
    `${p.StreetNumber} ${p.StreetName}, ${p.City}, ${p.StateOrProvince} ${p.PostalCode}`;

  return (
    <form action="/listings" className="search-panel home-search" onSubmit={(e) => {
      if (address.trim()) {
        const input = e.currentTarget.querySelector<HTMLInputElement>('input[name="address"]');
        if (input) input.value = address;
      }
    }}>
      <div className="home-search-location">
        <input
          name="address"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Address, city, ZIP code, or area"
          aria-label="Address, city, ZIP code, or area"
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <div className="listings-address-suggestions home-search-suggestions" role="listbox" aria-label="Matching properties">
            {suggestions.map((p) => (
              <button
                type="button"
                role="option"
                key={p.ListingId}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setAddress(selectedAddress(p)); setOpen(false); }}
              >
                <strong>{p.StreetNumber} {p.StreetName}</strong>
                <span>{p.City}, {p.StateOrProvince} {p.PostalCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <select name="beds" aria-label="Bedrooms"><option value="">Beds</option><option value="1">1+ beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option><option value="5">5+ beds</option></select>
      <select name="baths" aria-label="Bathrooms"><option value="">Baths</option><option value="1">1+ baths</option><option value="1.5">1.5+ baths</option><option value="2">2+ baths</option><option value="2.5">2.5+ baths</option><option value="3">3+ baths</option><option value="4">4+ baths</option></select>
      <select name="max" aria-label="Maximum price"><option value="">Price</option><option value="200000">Up to $200k</option><option value="300000">Up to $300k</option><option value="400000">Up to $400k</option><option value="500000">Up to $500k</option><option value="750000">Up to $750k</option><option value="1000000">Up to $1M</option></select>
      <button className="button button-dark">Search homes</button>
    </form>
  );
}
