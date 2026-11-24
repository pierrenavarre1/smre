'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import { LeadCaptureModal } from './LeadCaptureModal';

const SEEN_KEY = 'smre_exit_intent_seen_v1';

export function ExitIntentPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.localStorage.getItem(SEEN_KEY)) return;

    function handleMouseOut(event: MouseEvent) {
      if (triggered.current || document.visibilityState !== 'visible') return;
      // Do not stack the global exit-intent form over any lead form already on screen.
      if (document.querySelector('.lead-modal-backdrop')) return;
      if (event.clientY > 8 || event.relatedTarget !== null) return;
      triggered.current = true;
      window.localStorage.setItem(SEEN_KEY, '1');
      track('Exit Intent Popup Viewed', { sourcePage: pathname || '/' });
      setOpen(true);
    }

    document.addEventListener('mouseout', handleMouseOut);
    return () => document.removeEventListener('mouseout', handleMouseOut);
  }, [pathname]);

  if (!open) return null;
  return <LeadCaptureModal
    type="buyer"
    source="exit_intent"
    onClose={() => {
      track('Exit Intent Popup Dismissed', { sourcePage: pathname || '/' });
      setOpen(false);
    }}
  />;
}
