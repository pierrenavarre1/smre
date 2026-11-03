'use client';

import { useEffect, useRef, useState } from 'react';
import { LeadCaptureModal } from './LeadCaptureModal';

type Photo = { MediaKey: string; MediaURL: string };

export function ListingGallery({ photos, address, listingId }: { photos: Photo[]; address: string; listingId: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const mobileTrack = useRef<HTMLDivElement>(null);
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
  const photoUrl = (index: number) => `/api/mls-image?url=${encodeURIComponent(photos[index].MediaURL)}&listingId=${encodeURIComponent(listingId)}&index=${index}`;

  return (
    <>
      <div className="gallery-mobile" aria-label="Property photos">
        <div className="gallery-mobile-track" ref={mobileTrack} onScroll={(event) => { const el=event.currentTarget; const index=Math.round(el.scrollLeft/Math.max(1,el.clientWidth)); setMobileIndex(Math.min(photos.length-1,Math.max(0,index))); }}>
          {photos.map((photo,index)=><button type="button" className="gallery-mobile-slide" key={photo.MediaKey} onClick={()=>setOpen(index)} aria-label={`Open photo ${index+1}`}><img src={photoUrl(index)} alt={`${address} property photo ${index+1}`} loading={index<2?'eager':'lazy'} /></button>)}
        </div>
        <span className="gallery-mobile-count">{mobileIndex+1} of {photos.length}</span>
        <button type="button" className="gallery-mobile-tour" onClick={()=>setTourOpen(true)}>Request a Tour</button>
      </div>
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

      {tourOpen && <LeadCaptureModal type="showing" propertyAddress={address} listingId={listingId} onClose={()=>setTourOpen(false)} />}

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
            <img src={photoUrl(open)} alt={`${address} property photo ${open + 1}`} />
          </div>
          <button type="button" className="photo-lightbox-arrow photo-lightbox-next" onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Next photo">›</button>
          <div className="photo-lightbox-count">{open + 1} / {photos.length}</div>
        </div>
      )}
    </>
  );
}
