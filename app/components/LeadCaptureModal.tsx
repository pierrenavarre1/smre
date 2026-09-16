'use client';

import { FormEvent, useState } from 'react';

type LeadType = 'buyer' | 'seller';

export function LeadCaptureModal({ type, onClose }: { type: LeadType; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isBuyer = type === 'buyer';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '');
    const email = String(form.get('email') || '');
    const phone = String(form.get('phone') || '');
    const details = String(form.get('details') || '');
    const address = String(form.get('address') || '');

    if (!email && !phone) {
      setError('Please enter an email or phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, email, phone, address, message: details }),
      });
      if (!response.ok) throw new Error('Unable to submit');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please call us at (785) 465-2543.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`\n        .lead-modal-backdrop{position:fixed;inset:0;z-index:100;background:rgba(7,10,34,.62);display:grid;place-items:center;padding:22px}\n        .lead-modal{position:relative;width:min(560px,100%);max-height:calc(100vh - 44px);overflow:auto;background:#fff;color:var(--navy);padding:42px;box-shadow:0 24px 70px rgba(0,0,0,.25)}\n        .lead-modal-close{position:absolute;right:15px;top:10px;border:0;background:transparent;color:var(--navy);font-size:30px;line-height:1;cursor:pointer;padding:5px}\n        .lead-modal h2{font-family:var(--serif);font-weight:400;font-size:42px;line-height:1.02;letter-spacing:-.035em;margin:0 0 14px}\n        .lead-modal-intro{color:var(--muted);font-size:15px;margin:0;max-width:470px}\n        .lead-modal .lead-form{margin-top:26px;gap:16px}\n        .lead-modal .lead-form label{color:var(--navy);font-size:11px;letter-spacing:.02em}\n        .lead-modal .lead-form input,.lead-modal .lead-form textarea{border:1px solid var(--line);padding:12px;color:var(--navy);background:#fff}\n        .lead-modal .lead-form input:focus,.lead-modal .lead-form textarea:focus{border-color:var(--navy)}\n        .lead-form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}\n        .lead-form-note{font-size:11px;color:var(--muted);margin:0}\n        .lead-form-error{font-size:12px;color:#9b1c1c;margin:0}\n        .lead-modal-success p:not(.eyebrow){color:var(--muted);margin:0 0 24px}\n        @media(max-width:600px){.lead-modal{padding:34px 24px}.lead-modal h2{font-size:36px}.lead-form-row{grid-template-columns:1fr}}\n      `}</style>
      <div className="lead-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
          <button type="button" className="lead-modal-close" onClick={onClose} aria-label="Close">×</button>
          {submitted ? (
            <div className="lead-modal-success">
              <p className="eyebrow">THANK YOU</p>
              <h2 id="lead-modal-title">We’ll be in touch.</h2>
              <p>Your information has been sent to St. Mary’s Real Estate. Someone from our team will follow up with you.</p>
              <button type="button" className="button button-dark" onClick={onClose}>Close</button>
            </div>
          ) : (
            <>
              <p className="eyebrow">{isBuyer ? 'BUYING' : 'SELLING'}</p>
              <h2 id="lead-modal-title">{isBuyer ? 'Let’s find the right place.' : 'Thinking about selling?'}</h2>
              <p className="lead-modal-intro">{isBuyer ? 'Tell us a little about what you’re looking for. We’ll get back to you.' : 'Tell us a little about the property and what you’re considering. We’ll get back to you.'}</p>
              <form onSubmit={handleSubmit} className="lead-form">
                <label>Name<input name="name" required autoComplete="name" /></label>
                <div className="lead-form-row">
                  <label>Email<input name="email" type="email" autoComplete="email" /></label>
                  <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
                </div>
                {isBuyer ? (
                  <label>What are you looking for?<textarea name="details" rows={3} placeholder="Area, price range, type of property, timing, etc." /></label>
                ) : (
                  <>
                    <label>Property address<input name="address" autoComplete="street-address" /></label>
                    <label>What are you thinking about?<textarea name="details" rows={3} placeholder="Selling soon, just curious about value, considering a move, etc." /></label>
                  </>
                )}
                <p className="lead-form-note">Enter an email or phone number so we know how to reach you.</p>
                {error && <p className="lead-form-error">{error}</p>}
                <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Talk with SMRE'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
