'use client';

import { useState } from 'react';
import Link from 'next/link';

const links = [
  ['Listings', '/listings'],
  ['Home Value', '/valuation'],
  ['About', '/about'],
  ['Contact', '/contact'],
] as const;

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className={`mobile-menu-toggle${open ? ' is-open' : ''}`}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="mobile-menu-panel">
          <nav aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="mobile-menu-call">
            <span>Have a question?</span>
            <a href="tel:7854652543">Call (785) 465-2543</a>
          </div>
        </div>
      )}
    </div>
  );
}
