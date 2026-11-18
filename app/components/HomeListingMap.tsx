'use client';

import { useEffect, useState } from 'react';
import { ListingMap } from './ListingMap';
import type { ListingMapProperty } from '../lib/mock-properties';

export function HomeListingMap() {
  const [listings, setListings] = useState<ListingMapProperty[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const target = document.getElementById('home-listing-map-lazy');
    if (!target) return;
    let started = false;
    let observer: IntersectionObserver | undefined;
    const load = async () => {
      if (started) return;
      started = true;
      try {
        const response = await fetch('/api/home-map');
        if (!response.ok) throw new Error('Unable to load map listings');
        const data = await response.json();
        setListings(data.value || []);
      } catch {
        setError(true);
      }
    };
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          void load();
          observer?.disconnect();
        }
      }, { rootMargin: '350px 0px' });
      observer.observe(target);
    } else {
      void load();
    }
    return () => observer?.disconnect();
  }, []);

  return (
    <div id="home-listing-map-lazy">
      {listings ? <ListingMap listings={listings} searchAreaNavigate /> : (
        <div className="home-map-placeholder" aria-live="polite">
          <div className="home-map-placeholder-heading">
            <h3>Explore homes on the map.</h3>
            <span>{error ? 'The map could not be loaded. Please refresh the page to try again.' : 'The map will load as you scroll down.'}</span>
          </div>
          <div className="home-map-placeholder-surface" aria-hidden="true" />
        </div>
      )}
      <style>{`
        .home-map-placeholder{border:1px solid rgba(15,20,71,.13);border-radius:8px;overflow:hidden;background:#e8ebef}
        .home-map-placeholder-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:0 8px 18px;color:var(--navy)}
        .home-map-placeholder-heading h3{font-family:var(--serif);font-size:36px;font-weight:400;margin:0}
        .home-map-placeholder-heading span{font-size:13px;color:var(--muted)}
        .home-map-placeholder-surface{height:580px;background:linear-gradient(135deg,#e9edf0,#dfe5e9)}
        @media(max-width:700px){.home-map-placeholder-heading{display:block}.home-map-placeholder-heading h3{font-size:30px}.home-map-placeholder-heading span{display:block;margin-top:8px}.home-map-placeholder-surface{height:460px}}
      `}</style>
    </div>
  );
}
