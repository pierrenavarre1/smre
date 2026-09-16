'use client';

import { useState } from 'react';
import { LeadCaptureModal } from './LeadCaptureModal';

export function HomeLeadButtons() {
  const [type, setType] = useState<'buyer' | 'seller' | null>(null);

  return (
    <>
      <div className="home-hero-actions" aria-label="Buying or selling">
        <button type="button" className="button button-light" onClick={() => setType('buyer')}>I’M BUYING</button>
        <button type="button" className="button button-light" onClick={() => setType('seller')}>I’M SELLING</button>
      </div>
      {type && <LeadCaptureModal type={type} onClose={() => setType(null)} />}
    </>
  );
}
