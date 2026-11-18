'use client';
import { useState } from 'react';

export function LeadForm({ kind }: { kind: 'contact' | 'valuation' }) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    if (kind === 'valuation' && !String(formData.get('phone') || '').trim() && !String(formData.get('email') || '').trim()) {
      setError('Please provide either a phone number or an email address.');
      return;
    }
    setSubmitting(true);
    const body: Record<string, FormDataEntryValue | string> = Object.fromEntries(formData);
    body.type = kind;
    if (kind === 'valuation') {
      const detailLabels: Record<string, string> = {
        city: 'City', propertyType: 'Property type', bedrooms: 'Bedrooms',
        bathrooms: 'Bathrooms', squareFeet: 'Approximate square footage',
        yearBuilt: 'Year built', garage: 'Garage', basement: 'Basement',
        improvements: 'Improvements and features', favorite: 'What the owner likes about the property',
      };
      const details = Object.entries(detailLabels)
        .map(([key, label]) => {
          const value = String(formData.get(key) || '').trim();
          return value ? `${label}: ${value}` : '';
        })
        .filter(Boolean);
      const notes = String(formData.get('message') || '').trim();
      body.message = [...details, notes ? `Additional notes: ${notes}` : ''].filter(Boolean).join(' | ');
    }
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Unable to submit your request.');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your request. Please call (785) 465-2543.');
    } finally {
      setSubmitting(false);
    }
  }

  return done
    ? <div className="success"><h2>Request received.</h2><p>Thanks. The SMRE team will follow up directly.</p></div>
    : <form className="lead-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Name<input name="name" required autoComplete="name" /></label>
          <label>Phone<input name="phone" required={kind !== "valuation"} autoComplete="tel" /></label>
        </div>
        <label>Email<input name="email" type="email" required={kind !== "valuation"} autoComplete="email" /></label>
        {kind === 'valuation'
          ? <>
              <label>Property address<input name="address" required autoComplete="street-address" placeholder="Street address" /></label>
              <p className="contact-note">Please provide at least one way for us to reach you, either a phone number or email address. Additional property details are optional.</p>
              <details className="optional-details">
                <summary>Additional Property Details (Optional)</summary>
                <div className="optional-details-content">
                <div className="form-row">
                  <label>City<input name="city" autoComplete="address-level2" placeholder="City" /></label>
                  <label>Property type<select name="propertyType" defaultValue=""><option value="">Select property type</option><option>Single-family home</option><option>Townhome or condominium</option><option>Manufactured home</option><option>Multi-family</option><option>Land or acreage</option><option>Other</option></select></label>
                </div>
                <div className="form-row">
                  <label>Bedrooms<select name="bedrooms" defaultValue=""><option value="">Select</option>{[1,2,3,4,5,6].map(n=><option key={n}>{n}{n===6?' or more':''}</option>)}</select></label>
                  <label>Bathrooms<select name="bathrooms" defaultValue=""><option value="">Select</option>{['1','1.5','2','2.5','3','3.5','4','4.5','5+'].map(n=><option key={n}>{n}</option>)}</select></label>
                </div>
                <div className="form-row">
                  <label>Approximate square feet<input name="squareFeet" inputMode="numeric" placeholder="e.g. 1,800" /></label>
                  <label>Year built<input name="yearBuilt" inputMode="numeric" placeholder="e.g. 1998" /></label>
                </div>
                <div className="form-row">
                  <label>Garage space<select name="garage" defaultValue=""><option value="">Select</option><option>None</option><option>1 car</option><option>2 car</option><option>3 car</option><option>4+ car</option></select></label>
                  <label>Basement<select name="basement" defaultValue=""><option value="">Select</option><option>None</option><option>Full, unfinished</option><option>Full, partially finished</option><option>Full, finished</option><option>Partial</option><option>Walkout</option></select></label>
                </div>
                <label>Other features I should know about<textarea name="improvements" placeholder="Recent updates, acreage, outbuildings, shop, rural water, etc." /></label>
                <label>What do you like most about your property?<textarea name="favorite" placeholder="Tell us what makes your property special." /></label>
                <label>Anything else we should know?<textarea name="message" placeholder="Your timeline, questions, or anything else you'd like us to know." /></label>
                </div>
              </details>
            </>
          : <label>How can we help?<textarea name="message" required /></label>}
        {error && <p className="lead-form-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : kind === 'valuation' ? 'Request my free analysis' : 'Send message'}
        </button>
      </form>;
}
