'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Photo = { MediaKey: string; MediaURL: string };

export function ListingGallery({ photos, address }: { photos: Photo[]; address: string }) {
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

  if (!photos.length) return null;

  return (
    <>
      <div className="gallery">
        <button type="button" className="gallery-photo-button gallery-main" onClick={() => setOpen(0)} aria-label="Open photo 1">
          <Image src={photos[0].MediaURL} alt={address} fill sizes="(max-width:900px) 100vw, 66vw" priority />
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
              <Image src={media.MediaURL} alt={`${address} property photo`} fill sizes="(max-width:900px) 50vw, 33vw" />
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
            <img src={photos[open].MediaURL} alt={`${address} property photo ${open + 1}`} />
          </div>
          <button type="button" className="photo-lightbox-arrow photo-lightbox-next" onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Next photo">›</button>
          <div className="photo-lightbox-count">{open + 1} / {photos.length}</div>
        </div>
      )}
    </>
  );
}
