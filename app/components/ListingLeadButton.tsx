'use client';

import { useState } from 'react';
import { LeadCaptureModal } from './LeadCaptureModal';

export function ListingLeadButton({ address, listingId }: { address: string; listingId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="listing-lead-actions">
        <button type="button" className="button button-dark" onClick={() => setOpen(true)}>Request a Showing</button>
        <button type="button" className="button button-light" onClick={() => setOpen(true)}>Ask About This Property</button>
      </div>
      {open && <LeadCaptureModal type="property" propertyAddress={address} listingId={listingId} onClose={() => setOpen(false)} />}
    </>
  );
}
