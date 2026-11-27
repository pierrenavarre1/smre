'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function ExploreMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="nav-explore" ref={root}>
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(value => !value)}>
        Explore
      </button>
      {open && (
        <div className="nav-explore-menu">
          <Link href="/communities" onClick={() => setOpen(false)}>Communities</Link>
          <Link href="/local-resources" onClick={() => setOpen(false)}>Local Resources</Link>
        </div>
      )}
    </div>
  );
}
