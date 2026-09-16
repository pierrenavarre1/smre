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
    setSubmitting(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '');
    const email = String(form.get('email') || '');
    const phone = String(form.get('phone') || '');
    const details = String(form.get('details') || '');
    const address = String(form.get('address') || '');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          email,
          phone,
          address,
          message: details,
        }),
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
              <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Sending…' : isBuyer ? 'Talk with SMRE' : 'Talk with SMRE'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
