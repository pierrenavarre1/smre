'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { useState } from 'react';
import { LeadCaptureModal } from './LeadCaptureModal';

export function HomeLeadButtons() {
  const [buyerOpen, setBuyerOpen] = useState(false);

  return (
    <>
      <div className="home-hero-actions" aria-label="Buying or selling">
        <button type="button" className="button button-light" onClick={() => { track('Find a Property Click'); setBuyerOpen(true); }}>Find a Property</button>
        <Link href="/valuation" className="button button-light" onClick={() => track('Home Value Click')}>My Home Value</Link>
      </div>
      {buyerOpen && <LeadCaptureModal type="buyer" source="homepage_buyer" onClose={() => setBuyerOpen(false)} />}
    </>
  );
}
