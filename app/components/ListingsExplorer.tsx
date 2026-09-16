'use client';

import { useMemo, useState } from 'react';
import { ListingCard } from './ListingCard';
import type { RESOProperty } from '../lib/mock-properties';

const PAGE_SIZE = 24;

type Filters = {
  type: string;
  source: string;
  status: string;
  beds: string;
  baths: string;
  max: string;
  city: string;
};

export function ListingsExplorer({ items, initialFilters = {} }: { items: RESOProperty[]; initialFilters?: Partial<Filters> }) {
  const [filters, setFilters] = useState<Filters>({ type: '', source: '', status: 'Active', beds: '', baths: '', max: '', city: '', ...initialFilters });
  const [sort, setSort] = useState('price-asc');
  const [page, setPage] = useState(1);

  const shown = useMemo(() => {
    return items
      .filter((p) =>
        (!filters.type || p.PropertyType === filters.type) &&
        (!filters.source || p.MlsSource === filters.source) &&
        (!filters.status || p.StandardStatus === filters.status) &&
        (!filters.beds || p.BedroomsTotal >= Number(filters.beds)) &&
        (!filters.baths || p.BathroomsTotalInteger >= Number(filters.baths)) &&
        (!filters.max || p.ListPrice <= Number(filters.max)) &&
        (!filters.city || p.City.toLowerCase().includes(filters.city.toLowerCase().trim()))
      )
      .sort((a, b) => sort === 'price-desc' ? b.ListPrice - a.ListPrice : a.ListPrice - b.ListPrice);
  }, [items, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = shown.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const update = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  return (
    <>
      <div className="filters">
        <input aria-label="City" value={filters.city} onChange={(e) => update('city', e.target.value)} placeholder="City" />
        <select aria-label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="Active">Active</option><option value="">All statuses</option><option value="Pending">Pending</option></select>
        <select aria-label="Property type" value={filters.type} onChange={(e) => update('type', e.target.value)}><option value="">All property types</option><option>Residential</option><option>Farm</option><option>Land</option><option>Commercial</option></select>
        <select aria-label="MLS source" value={filters.source} onChange={(e) => update('source', e.target.value)}><option value="">Both MLSs</option><option>Sunflower MLS</option><option>FHAR MLS</option></select>
        <select aria-label="Bedrooms" value={filters.beds} onChange={(e) => update('beds', e.target.value)}><option value="">Any beds</option><option value="1">1+ beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option><option value="5">5+ beds</option></select>
        <select aria-label="Bathrooms" value={filters.baths} onChange={(e) => update('baths', e.target.value)}><option value="">Any baths</option><option value="1">1+ baths</option><option value="1.5">1.5+ baths</option><option value="2">2+ baths</option><option value="2.5">2.5+ baths</option><option value="3">3+ baths</option><option value="4">4+ baths</option></select>
        <select aria-label="Maximum price" value={filters.max} onChange={(e) => update('max', e.target.value)}><option value="">Any price</option><option value="200000">Under $200k</option><option value="300000">Under $300k</option><option value="400000">Under $400k</option><option value="500000">Under $500k</option><option value="750000">Under $750k</option><option value="1000000">Under $1M</option></select>
        <select aria-label="Sort listings" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select>
      </div>
      <p className="result-count">{shown.length} {shown.length === 1 ? 'property' : 'properties'}{pageCount > 1 ? ` · Page ${currentPage} of ${pageCount}` : ''}</p>
      <div className="listing-grid">{paged.map((p) => <ListingCard key={p.ListingId} p={p} />)}</div>
      {pageCount > 1 && (
        <nav className="pagination" aria-label="Listings pagination">
          <button className="button button-light" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
          <span>Page {currentPage} of {pageCount}</span>
          <button className="button button-light" disabled={currentPage === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</button>
        </nav>
      )}
    </>
  );
}
