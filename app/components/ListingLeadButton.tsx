'use client';

import { useState } from 'react';
import { LeadCaptureModal } from './LeadCaptureModal';

export function ListingLeadButton({ address, listingId }: { address: string; listingId: string }) {
  const [open, setOpen] = useState<'showing' | 'property' | null>(null);

  return (
    <>
      <div className="listing-lead-actions">
        <button type="button" className="button button-dark" onClick={() => setOpen('showing')}>Request a Showing</button>
        <button type="button" className="button button-light" onClick={() => setOpen('property')}>Ask About This Property</button>
      </div>
      {open && <LeadCaptureModal type={open} propertyAddress={address} listingId={listingId} onClose={() => setOpen(null)} />}
    </>
  );
}
