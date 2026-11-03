'use client';
import { useState } from 'react';

export function LeadForm({ kind }: { kind: 'contact' | 'valuation' }) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.type = kind;
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
          <label>Phone<input name="phone" required autoComplete="tel" /></label>
        </div>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        {kind === 'valuation'
          ? <>
              <label>Property address<input name="address" required autoComplete="street-address" /></label>
              <label>Anything we should know?<textarea name="message" placeholder="Timeline, improvements, questions, etc." /></label>
            </>
          : <label>How can we help?<textarea name="message" required /></label>}
        {error && <p className="lead-form-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : kind === 'valuation' ? "Find my Home's Value" : 'Send message'}
        </button>
      </form>;
}
