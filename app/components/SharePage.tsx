'use client';

import { useState } from 'react';

export function SharePage({ title, description }: { title: string; description?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this link', window.location.href);
    }
  }

  async function sharePage() {
    const url = window.location.href;
    const text = description ? `${title}\\n${description}` : title;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setOpen(true);
      }
    } else {
      setOpen(value => !value);
    }
  }

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return <div className="page-share">
    <button type="button" className="page-share-trigger" aria-expanded={open} aria-haspopup="true" onClick={sharePage}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/></svg>
      Share
    </button>
    {open && <div className="page-share-menu" role="menu" aria-label="Share this page">
      <a role="menuitem" href={facebookUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Facebook</a>
      <button type="button" role="menuitem" onClick={copyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
    </div>}
  </div>;
}
