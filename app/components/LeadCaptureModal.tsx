'use client';

import { FormEvent, useState } from 'react';
import { track } from '@vercel/analytics';

type LeadType = 'buyer' | 'seller' | 'property' | 'showing';
type LeadSource = 'homepage_buyer' | 'exit_intent' | 'standard';

export function LeadCaptureModal({ type, onClose, propertyAddress, listingId, source = 'standard' }: { type: LeadType; onClose: () => void; propertyAddress?: string; listingId?: string; source?: LeadSource }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isBuyer = type === 'buyer';
  const isProperty = type === 'property';
  const isShowing = type === 'showing';
  const isMarketInterest = source === 'exit_intent';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '');
    const email = String(form.get('email') || '');
    const phone = String(form.get('phone') || '');
    const details = String(form.get('details') || '');
    const address = String(form.get('address') || propertyAddress || '');
    const preferredDate = String(form.get('preferredDate') || '');
    const preferredTime = String(form.get('preferredTime') || '');
    const preferredLocation = String(form.get('preferredLocation') || '');
    const priceRange = String(form.get('priceRange') || '');
    const propertyType = String(form.get('propertyType') || '');
    const sourcePage = typeof window !== 'undefined' ? window.location.pathname : '';

    if (!email && !phone) {
      setError('Please enter an email or phone number.');
      return;
    }

    const preferenceDetails = isBuyer
      ? [
          preferredLocation ? `Preferred location: ${preferredLocation}` : '',
          priceRange ? `Price range: ${priceRange}` : '',
          propertyType ? `Property type: ${propertyType}` : '',
          details ? `Additional comments: ${details}` : '',
        ].filter(Boolean).join('\n')
      : details;

    setSubmitting(true);
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
          listingId,
          preferredDate: isShowing ? preferredDate : undefined,
          preferredTime: isShowing ? preferredTime : undefined,
          message: preferenceDetails,
          source,
          sourcePage,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Unable to submit');
      }
      track('Lead Submission', { inquiryType: type, leadSource: source, sourcePage, listingId: listingId || 'general' });
      if (isBuyer) track(isMarketInterest ? 'Local Market Interest Submission' : 'Buyer Interest Submission', { leadSource: source, sourcePage });
      if (isProperty) track('Property Inquiry Submission', { sourcePage, listingId: listingId || 'unknown' });
      if (isShowing) track('Showing Request Submission', { sourcePage, listingId: listingId || 'unknown' });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please call us at (785) 465-2543.');
    } finally {
      setSubmitting(false);
    }
  }

  const title = isShowing ? 'Request a showing.' : isProperty ? 'Interested in this property?' : isMarketInterest ? 'Keep in the know about the local market?' : isBuyer ? 'Find a property.' : 'Thinking about selling?';
  const intro = isShowing
    ? `Tell us when you’d like to see ${propertyAddress || 'this property'}. We’ll get back to you to confirm availability.`
    : isProperty ? `Ask a question about ${propertyAddress || 'this property'}. We’ll get back to you.`
    : isMarketInterest ? 'Tell us which areas and types of properties you follow. We’ll be in touch with relevant local market information.'
    : isBuyer ? 'Tell us what you’re looking for and we’ll follow up with you.'
    : 'Tell us a little about the property and what you’re considering. We’ll get back to you.';

  return (
    <>
      <style>{`
        .lead-modal-backdrop{position:fixed;inset:0;z-index:100;background:rgba(7,10,34,.62);display:grid;place-items:center;padding:22px}
        .lead-modal{position:relative;width:min(560px,100%);max-height:calc(100vh - 44px);overflow:auto;background:#fff;color:var(--navy);padding:42px;box-shadow:0 24px 70px rgba(0,0,0,.25)}
        .lead-modal-close{position:absolute;right:15px;top:10px;border:0;background:transparent;color:var(--navy);font-size:30px;line-height:1;cursor:pointer;padding:5px}
        .lead-modal h2{font-family:var(--serif);font-weight:400;font-size:42px;line-height:1.02;letter-spacing:-.035em;margin:0 0 14px}
        .lead-modal-intro{color:var(--muted);font-size:15px;margin:0;max-width:470px}
        .lead-modal .lead-form{margin-top:26px;gap:16px}
        .lead-modal .lead-form label{color:var(--navy);font-size:11px;letter-spacing:.02em}
        .lead-modal .lead-form input,.lead-modal .lead-form textarea,.lead-modal .lead-form select{border:1px solid var(--line);padding:12px;color:var(--navy);background:#fff;width:100%}
        .lead-modal .lead-form input:focus,.lead-modal .lead-form textarea:focus,.lead-modal .lead-form select:focus{border-color:var(--navy)}
        .lead-form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .lead-form-note{font-size:11px;color:var(--muted);margin:0}
        .lead-form-error{font-size:12px;color:#9b1c1c;margin:0}
        .lead-modal-success p:not(.eyebrow){color:var(--muted);margin:0 0 24px}
        @media(max-width:600px){.lead-modal{padding:34px 24px}.lead-modal h2{font-size:36px}.lead-form-row{grid-template-columns:1fr}}
      `}</style>
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
              <p className="eyebrow">{isShowing ? 'REQUEST A SHOWING' : isProperty ? 'PROPERTY INQUIRY' : isMarketInterest ? 'LOCAL MARKET' : isBuyer ? 'BUYER INTEREST' : 'SELLING'}</p>
              <h2 id="lead-modal-title">{title}</h2>
              <p className="lead-modal-intro">{intro}</p>
              <form onSubmit={handleSubmit} className="lead-form">
                <label>Name<input name="name" required autoComplete="name" /></label>
                <div className="lead-form-row">
                  <label>Email<input name="email" type="email" autoComplete="email" /></label>
                  <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
                </div>
                {isBuyer ? (
                  <>
                    <label>Preferred location<input name="preferredLocation" placeholder="City, area, or communities" /></label>
                    <div className="lead-form-row">
                      <label>Price range<select name="priceRange" defaultValue=""><option value="">Select a range</option><option>Under $150,000</option><option>$150,000–$250,000</option><option>$250,000–$350,000</option><option>$350,000–$500,000</option><option>$500,000–$750,000</option><option>$750,000+</option><option>Flexible / Not sure yet</option></select></label>
                      <label>Property type<select name="propertyType" defaultValue=""><option value="">Any property type</option><option>Single-family home</option><option>Townhome or condominium</option><option>Manufactured home</option><option>Multi-family</option><option>Land or acreage</option><option>Commercial</option><option>Other</option></select></label>
                    </div>
                    <label>Additional comments (optional)<textarea name="details" rows={3} placeholder="Timing, features, or anything else you have in mind." /></label>
                  </>
                ) : isShowing ? (
                  <>
                    <label>Property address<input name="address" value={propertyAddress || ''} readOnly /></label>
                    <div className="lead-form-row">
                      <label>Preferred date<input name="preferredDate" type="date" /></label>
                      <label>Preferred time<input name="preferredTime" type="time" step={300} /></label>
                    </div>
                    <label>Anything we should know?<textarea name="details" rows={3} placeholder="Availability, questions, or anything else." /></label>
                  </>
                ) : isProperty ? (
                  <>
                    <label>Property address<input name="address" value={propertyAddress || ''} readOnly /></label>
                    <label>What would you like to know?<textarea name="details" rows={3} placeholder="Questions about the property, an offer, or anything else." /></label>
                  </>
                ) : (
                  <>
                    <label>Property address<input name="address" autoComplete="street-address" /></label>
                    <label>What are you thinking about?<textarea name="details" rows={3} placeholder="Selling soon, just curious about value, considering a move, etc." /></label>
                  </>
                )}
                <p className="lead-form-note">Enter an email or phone number so we know how to reach you.</p>
                {error && <p className="lead-form-error" role="alert">{error}</p>}
                <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Sending…' : isShowing ? 'Request Showing' : isBuyer ? 'Send My Preferences' : 'Talk with SMRE'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
