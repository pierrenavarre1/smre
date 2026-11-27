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

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const message = `Take a look at this page from St. Mary’s Real Estate: ${url}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const messageUrl = `sms:?&body=${encodeURIComponent(message)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${message}${description ? `\\n\\n${description}` : ''}`) }`;

  return <div className="page-share">
    <button type="button" className="page-share-trigger" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(value => !value)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/></svg>
      Share
    </button>
    {open && <div className="page-share-menu" role="menu" aria-label="Share this page">
      <a role="menuitem" href={facebookUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Facebook</a>
      <a role="menuitem" href={messageUrl} onClick={() => setOpen(false)}>Text message</a>
      <a role="menuitem" href={emailUrl} onClick={() => setOpen(false)}>Email</a>
      <button type="button" role="menuitem" onClick={copyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
    </div>}
  </div>;
}
