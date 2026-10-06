'use client';

import { useState } from 'react';
import { LeadCaptureModal } from './LeadCaptureModal';

export function ListingLeadButton({ address, listingId }: { address: string; listingId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="button button-dark" onClick={() => setOpen(true)}>
        Ask about this property
      </button>
      {open && <LeadCaptureModal type="property" propertyAddress={address} listingId={listingId} onClose={() => setOpen(false)} />}
    </>
  );
}
