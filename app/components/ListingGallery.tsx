'use client';

import { useEffect, useRef, useState } from 'react';

type Photo = { MediaKey: string; MediaURL: string };

export function ListingGallery({ photos, address, listingId }: { photos: Photo[]; address: string; listingId: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const close = () => setOpen(null);
  const previous = () => setOpen((current) => current === null ? null : (current - 1 + photos.length) % photos.length);
  const next = () => setOpen((current) => current === null ? null : (current + 1) % photos.length);

  useEffect(() => {
    if (open === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, photos.length]);

  // Only the specifically provisioned MLS Grid CDN host is suitable for direct
  // browser display. Standard media.mlsgrid.com URLs are single-use download
  // URLs, so route those through the server-side cache instead.
  const photoUrl = (index: number) => {
    const mediaUrl = photos[index].MediaURL;
    try {
      const parsed = new URL(mediaUrl);
      if (parsed.protocol === 'https:' && parsed.hostname === 'cdn-stmarys.mlsgrid.com') {
        return mediaUrl;
      }
    } catch {}
    // The detail page can have a fresh full media manifest while the stored
    // listing record intentionally contains only its thumbnail. Pass this exact
    // photo URL and stable MediaKey so the proxy can cache each gallery image
    // independently instead of looking up the index in the stale one-photo record.
    if (mediaUrl.startsWith('smre-blob:')) {
      return `/api/mls-image?listingId=${encodeURIComponent(listingId)}&index=${index}`;
    }
    return `/api/mls-image?listingId=${encodeURIComponent(listingId)}&mediaKey=${encodeURIComponent(photos[index].MediaKey)}&url=${encodeURIComponent(mediaUrl)}`;
  };

  useEffect(() => {
    if (open === null || photos.length < 2) return;
    // Warm the adjacent images while the current photo is displayed so swiping
    // usually changes photos without waiting for a fresh network request.
    const adjacent = [
      (open - 1 + photos.length) % photos.length,
      (open + 1) % photos.length
    ];
    adjacent.forEach((index) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = photoUrl(index);
    });
  }, [open, photos.length, listingId]);

  if (!photos.length) {
    return (
      <div className="gallery gallery-empty" role="img" aria-label={`Photos currently unavailable for ${address}`}>
        <div className="gallery-empty-message">
          <strong>Photos currently unavailable</strong>
          <span>Listing photos may not be available from the MLS feed right now.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="gallery">
        <button type="button" className="gallery-photo-button gallery-main" onClick={() => setOpen(0)} aria-label="Open photo 1">
          <img src={photoUrl(0)} alt={address} loading="eager" />
          <span className="gallery-view-label">View photos</span>
        </button>
        <div className="gallery-side">
          {photos.slice(1, 5).map((media, index) => (
            <button
              type="button"
              className="gallery-photo-button"
              key={media.MediaKey}
              onClick={() => setOpen(index + 1)}
              aria-label={`Open photo ${index + 2}`}
            >
              <img src={photoUrl(index + 1)} alt={`${address} property photo`} loading="lazy" />
              {index === 3 && photos.length > 5 ? <span className="gallery-more">+{photos.length - 5} more</span> : null}
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`Photo ${open + 1} of ${photos.length}`} onClick={close}>
          <button type="button" className="photo-lightbox-close" onClick={close} aria-label="Close photo viewer">×</button>
          <button type="button" className="photo-lightbox-arrow photo-lightbox-prev" onClick={(event) => { event.stopPropagation(); previous(); }} aria-label="Previous photo">‹</button>
          <div
            className="photo-lightbox-stage"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              if (touchStart.current === null) return;
              const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
              touchStart.current = null;
              if (Math.abs(delta) > 50) delta < 0 ? next() : previous();
            }}
          >
            <img src={photoUrl(open)} alt={`${address} property photo ${open + 1}`} loading="eager" decoding="async" />
          </div>
          <button type="button" className="photo-lightbox-arrow photo-lightbox-next" onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Next photo">›</button>
          <div className="photo-lightbox-count">{open + 1} / {photos.length}</div>
        </div>
      )}
    </>
  );
}
