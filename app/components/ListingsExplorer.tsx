'use client';

import { useMemo, useState } from 'react';
import { ListingCard } from './ListingCard';
import { ListingMap } from './ListingMap';
import type { RESOProperty } from '../lib/mock-properties';

const PAGE_SIZE = 24;

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

type Filters = {
  type: string[];
  status: string;
  beds: string;
  baths: string;
  max: string;
  acreage: string;
  city: string;
  address: string;
};

export function ListingsExplorer({ items, initialFilters = {} }: { items: RESOProperty[]; initialFilters?: Partial<Filters> }) {
  const [filters, setFilters] = useState<Filters>({
    type: [],
    status: 'Active',
    beds: '',
    baths: '',
    max: '',
    acreage: '',
    city: '',
    address: '',
    ...initialFilters,
  });
  const [sort, setSort] = useState('priority');
  const [page, setPage] = useState(1);
  const [addressOpen, setAddressOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const shown = useMemo(() => {
    const normalize = (value: string) =>
      value.toLowerCase().replace(/[.'’,-]/g, ' ').replace(/\\s+/g, ' ').trim();

    const isSMRE = (p: RESOProperty) => {
      const office = normalize(p.ListOfficeName || '');
      return office.includes('st mary') && office.includes('real estate');
    };

    const isCoreLocalArea = (p: RESOProperty) => {
      const city = normalize(p.City || '');
      return city === 'st marys' || city === 'saint marys' || city === 'wamego';
    };

    const listingTimestamp = (p: RESOProperty) => {
      const value = p.ListingDate ? Date.parse(p.ListingDate) : 0;
      return Number.isFinite(value) ? value : 0;
    };

    const priorityCompare = (a: RESOProperty, b: RESOProperty) => {
      const aSMRE = isSMRE(a);
      const bSMRE = isSMRE(b);
      if (aSMRE !== bSMRE) return aSMRE ? -1 : 1;

      const aLocal = isCoreLocalArea(a);
      const bLocal = isCoreLocalArea(b);
      if (aLocal !== bLocal) return aLocal ? -1 : 1;

      return listingTimestamp(b) - listingTimestamp(a);
    };

    return items
      .filter((p) => {
        const baths = p.BathroomsTotalInteger + (p.BathroomsHalf ? 0.5 : 0);
        return (
          (filters.type.length === 0 || filters.type.includes(p.PropertyType)) &&
          (!filters.status || p.StandardStatus === filters.status) &&
          (!filters.beds || p.BedroomsTotal >= Number(filters.beds)) &&
          (!filters.baths || baths >= Number(filters.baths)) &&
          (!filters.max || p.ListPrice <= Number(filters.max)) &&
          (!filters.acreage || (p.LotSizeAcres || 0) >= Number(filters.acreage)) &&
          (!filters.city ||
            p.City.toLowerCase().includes(filters.city.toLowerCase().trim()) ||
            p.PostalCode.includes(filters.city.trim())) &&
          (!filters.address ||
            normalizeSearch(
              `${p.StreetNumber} ${p.StreetName} ${p.City} ${p.StateOrProvince} ${p.PostalCode}`
            ).includes(normalizeSearch(filters.address)))
        );
      })
      .sort((a, b) => {
        if (sort === 'price-desc') return b.ListPrice - a.ListPrice;
        if (sort === 'price-asc') return a.ListPrice - b.ListPrice;
        return priorityCompare(a, b);
      });
  }, [items, filters, sort]);

  const addressSuggestions = useMemo(() => {
    const query = normalizeSearch(filters.address);
    if (!query) return [];
    return items
      .filter((p) => {
        const full = normalizeSearch(
          `${p.StreetNumber} ${p.StreetName} ${p.City} ${p.StateOrProvince} ${p.PostalCode}`
        );
        return full.includes(query);
      })
      .slice(0, 6);
  }, [items, filters.address]);

  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = shown.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const update = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: [], status: 'Active', beds: '', baths: '', max: '', acreage: '', city: '', address: '' });
    setAddressOpen(false);
    setTypeOpen(false);
    setMobileFiltersOpen(false);
    setPage(1);
  };

  return (
    <>
      <div className="listings-searchbar">
        <div className="listings-location-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Address, city, or ZIP code"
            value={filters.address || filters.city}
            onFocus={() => setAddressOpen(true)}
            onChange={(e) => {
              setAddressOpen(true);
              update('address', e.target.value);
              if (filters.city) setFilters((current) => ({ ...current, city: '' }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter') {
                setAddressOpen(false);
                setPage(1);
              }
            }}
            placeholder="Address, city, or ZIP code"
          />
          {(filters.address || filters.city) && (
            <button type="button" onClick={() => { update('address', ''); update('city', ''); setAddressOpen(false); }} aria-label="Clear location search">
              ×
            </button>
          )}
          {addressOpen && addressSuggestions.length > 0 && (
            <div className="listings-address-suggestions" role="listbox" aria-label="Matching properties">
              {addressSuggestions.map((p) => (
                <button
                  type="button"
                  key={p.ListingId}
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setFilters((current) => ({
                      ...current,
                      address: `${p.StreetNumber} ${p.StreetName}, ${p.City}, ${p.StateOrProvince} ${p.PostalCode}`,
                      city: '',
                    }));
                    setAddressOpen(false);
                    setPage(1);
                  }}
                >
                  <strong>{p.StreetNumber} {p.StreetName}</strong>
                  <span>{p.City}, {p.StateOrProvince} {p.PostalCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="button button-dark listings-search-button"
          onClick={() => {
            setAddressOpen(false);
            setPage(1);
          }}
        >
          Search
        </button>

        <button
          type="button"
          className="listings-mobile-filter-button"
          aria-label="Open filters"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen(true)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          <span>Filters</span>
          {(() => {
            const count = [filters.beds, filters.baths, filters.max, filters.acreage, filters.status !== 'Active' ? filters.status : '', filters.type.length ? 'type' : ''].filter(Boolean).length;
            return count > 0 ? <em>{count}</em> : null;
          })()}
        </button>

        <div className="listings-filter-selects">
          <div className="listings-type-filter">
            <button
              type="button"
              className="listings-type-filter-button"
              aria-haspopup="listbox"
              aria-expanded={typeOpen}
              onClick={() => setTypeOpen((open) => !open)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.preventDefault();
                  setTypeOpen((open) => !open);
                }
              }}
            >
              <span>
                {filters.type.length === 0
                  ? 'Property type'
                  : filters.type.length === 1
                    ? filters.type[0]
                    : `${filters.type.length} types`}
              </span>
              <span aria-hidden="true">⌄</span>
            </button>
            {typeOpen && (
              <div className="listings-type-options" role="listbox" aria-label="Property types" aria-multiselectable="true">
                {['Residential', 'Farm', 'Land', 'Commercial'].map((type) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={filters.type.includes(type)}
                      onChange={() => {
                        setFilters((current) => ({
                          ...current,
                          type: current.type.includes(type)
                            ? current.type.filter((value) => value !== type)
                            : [...current.type, type],
                        }));
                        setPage(1);
                        setTypeOpen(false);
                      }}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <select aria-label="Bedrooms" value={filters.beds} onChange={(e) => update('beds', e.target.value)}>
            <option value="">Beds</option>
            <option value="1">1+ beds</option>
            <option value="2">2+ beds</option>
            <option value="3">3+ beds</option>
            <option value="4">4+ beds</option>
            <option value="5">5+ beds</option>
          </select>

          <select aria-label="Bathrooms" value={filters.baths} onChange={(e) => update('baths', e.target.value)}>
            <option value="">Baths</option>
            <option value="1">1+ baths</option>
            <option value="1.5">1.5+ baths</option>
            <option value="2">2+ baths</option>
            <option value="2.5">2.5+ baths</option>
            <option value="3">3+ baths</option>
            <option value="4">4+ baths</option>
          </select>

          <select aria-label="Maximum price" value={filters.max} onChange={(e) => update('max', e.target.value)}>
            <option value="">Price</option>
            <option value="200000">Under $200k</option>
            <option value="300000">Under $300k</option>
            <option value="400000">Under $400k</option>
            <option value="500000">Under $500k</option>
            <option value="750000">Under $750k</option>
            <option value="1000000">Under $1M</option>
          </select>

          <select aria-label="Acreage" value={filters.acreage} onChange={(e) => update('acreage', e.target.value)}>
            <option value="">Acreage</option>
            <option value="0.25">¼+ acre</option>
            <option value="0.5">½+ acre</option>
            <option value="1">1+ acre</option>
            <option value="2">2+ acres</option>
            <option value="5">5+ acres</option>
            <option value="10">10+ acres</option>
            <option value="20">20+ acres</option>
            <option value="40">40+ acres</option>
          </select>

          <select aria-label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}>
            <option value="Active">Active</option>
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <button type="button" className="listings-clear-filter" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {mobileFiltersOpen && (
        <div className="listings-mobile-filter-overlay" role="dialog" aria-modal="true" aria-label="Listing filters">
          <button type="button" className="listings-mobile-filter-backdrop" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} />
          <div className="listings-mobile-filter-panel">
            <div className="listings-mobile-filter-header"><strong>Filters</strong><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">×</button></div>
            <div className="listings-mobile-filter-fields">
              <div className="listings-type-filter">
                <button type="button" className="listings-type-filter-button" aria-haspopup="listbox" aria-expanded={typeOpen} onClick={() => setTypeOpen((open) => !open)}>
                  <span>{filters.type.length === 0 ? 'Property type' : filters.type.length === 1 ? filters.type[0] : filters.type.length + ' types'}</span><span aria-hidden="true">⌄</span>
                </button>
                {typeOpen && (<div className="listings-type-options" role="listbox" aria-label="Property types" aria-multiselectable="true">
                  {['Residential', 'Farm', 'Land', 'Commercial'].map((type) => (<label key={type}><input type="checkbox" checked={filters.type.includes(type)} onChange={() => { setFilters((current) => ({ ...current, type: current.type.includes(type) ? current.type.filter((value) => value !== type) : [...current.type, type] })); setPage(1); setTypeOpen(false); }} /><span>{type}</span></label>))}
                </div>)}
              </div>
              <select aria-label="Bedrooms" value={filters.beds} onChange={(e) => update('beds', e.target.value)}><option value="">Beds</option><option value="1">1+ beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option><option value="5">5+ beds</option></select>
              <select aria-label="Bathrooms" value={filters.baths} onChange={(e) => update('baths', e.target.value)}><option value="">Baths</option><option value="1">1+ baths</option><option value="1.5">1.5+ baths</option><option value="2">2+ baths</option><option value="2.5">2+ baths</option><option value="3">3+ baths</option><option value="4">4+ baths</option></select>
              <select aria-label="Maximum price" value={filters.max} onChange={(e) => update('max', e.target.value)}><option value="">Price</option><option value="200000">Under $200k</option><option value="300000">Under $300k</option><option value="400000">Under $400k</option><option value="500000">Under $500k</option><option value="750000">Under $750k</option><option value="1000000">Under $1M</option></select>
              <select aria-label="Acreage" value={filters.acreage} onChange={(e) => update('acreage', e.target.value)}><option value="">Acreage</option><option value="0.25">¼+ acre</option><option value="0.5">½+ acre</option><option value="1">1+ acre</option><option value="2">2+ acres</option><option value="5">5+ acres</option><option value="10">10+ acres</option><option value="20">20+ acres</option><option value="40">40+ acres</option></select>
              <select aria-label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="Active">Active</option><option value="">All statuses</option><option value="Pending">Pending</option></select>
            </div>
            <div className="listings-mobile-filter-actions"><button type="button" className="button button-light" onClick={clearFilters}>Clear filters</button><button type="button" className="button button-dark" onClick={() => setMobileFiltersOpen(false)}>View {shown.length} {shown.length === 1 ? 'home' : 'homes'}</button></div>
          </div>
        </div>
      )}

      {shown.length > 0 ? (
        <div className="listings-search-layout">
          <div className="listings-map-column">
            <ListingMap listings={shown} />
          </div>

          <div className="listings-results-column">
            <div className="listings-results-toolbar">
              <div>
                <strong>{shown.length} {shown.length === 1 ? 'home' : 'homes'}</strong>
                <span> for sale</span>
              </div>
              <label>
                <span>Sort</span>
                <select
                  aria-label="Sort listings"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="priority">SMRE & local first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </label>
            </div>

            <div className="listing-grid">
              {paged.map((p) => (
                <ListingCard key={p.ListingId} p={p} />
              ))}
            </div>

            {pageCount > 1 && (
              <nav className="pagination" aria-label="Listings pagination">
                <button className="button button-light" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </button>
                <span>Page {currentPage} of {pageCount}</span>
                <button className="button button-light" disabled={currentPage === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                  Next
                </button>
              </nav>
            )}
          </div>
        </div>
      ) : (
        <div className="listing-search-empty">
          <h3>No properties match those filters.</h3>
          <p>Try widening the city, price, bedroom, or property type search.</p>
          <button type="button" className="button button-light" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
    </>
  );
}
