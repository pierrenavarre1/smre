import { NextResponse } from 'next/server';
import { addLead } from '../../lib/admin-store';
import { encryptFubPersonId, FUB_IDENTITY_COOKIE } from '../../lib/fub-identity';

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || '', lastName: parts.join(' ') };
}

export async function POST(request: Request) {
  try {
    const lead = await request.json();
    const name = String(lead?.name || '').trim();
    const contact = String(lead?.contact || '');
    const email = String(lead?.email || (contact.includes('@') ? contact : '')).trim();
    const phone = String(lead?.phone || (!contact.includes('@') ? contact : '')).trim();
    const details = String(lead?.message || lead?.details || '').trim();
    const sourcePage = typeof lead?.sourcePage === 'string' && lead.sourcePage.startsWith('/')
      ? lead.sourcePage.slice(0, 300)
      : '';
    const sourceLabel = lead?.source === 'exit_intent' ? 'EXIT-INTENT LOCAL MARKET FORM'
      : lead?.source === 'homepage_buyer' ? 'HOMEPAGE FIND A PROPERTY FORM' : 'WEBSITE FORM';
    const message = [
      sourceLabel,
      sourcePage ? `PAGE: ${sourcePage}` : '',
      lead?.type === 'buyer' ? 'BUYER PREFERENCES' : '',
      details,
    ].filter(Boolean).join('\n');

    if (!name || (!email && !phone)) {
      return NextResponse.json({ error: 'Name and contact information are required.' }, { status: 400 });
    }

    const apiKey = process.env.FUB_API_KEY;
    const systemKey = process.env.FUB_SYSTEM_KEY;
    if (!apiKey || !systemKey) {
      console.error('FUB lead submission unavailable: required environment variables are missing.');
      return NextResponse.json({ error: 'Lead submission is temporarily unavailable. Please call (785) 465-2543.' }, { status: 503 });
    }

    const { firstName, lastName } = splitName(name);
    const eventType = lead.type === 'seller' || lead.type === 'valuation'
      ? 'Seller Inquiry'
      : lead.type === 'showing'
        ? 'Property Inquiry'
        : lead.type === 'property'
          ? 'Property Inquiry'
          : lead.type === 'buyer'
            ? 'General Inquiry'
            : 'General Inquiry';

    const rawListingId = lead.listingId ? String(lead.listingId) : '';
    const listingId = rawListingId.includes(':') ? rawListingId.split(':').pop() || rawListingId : rawListingId;
    const preferredDate = lead.preferredDate ? String(lead.preferredDate) : '';
    const preferredTime = lead.preferredTime ? String(lead.preferredTime) : '';
    const displayDate = preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
      ? (() => { const [year, month, day] = preferredDate.split('-').map(Number); return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })()
      : preferredDate;
    const displayTime = preferredTime && /^\d{2}:\d{2}$/.test(preferredTime)
      ? (() => { const [hour, minute] = preferredTime.split(':').map(Number); const suffix = hour >= 12 ? 'PM' : 'AM'; return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`; })()
      : preferredTime;
    const eventMessage = [
      lead.type === 'showing' ? 'SHOWING REQUEST' : '',
      displayDate || displayTime ? `WHEN: ${[displayDate, displayTime].filter(Boolean).join(' at ')}` : '',
      lead.address ? `PROPERTY: ${String(lead.address)}` : '',
      listingId ? `MLS #: ${listingId}` : '',
      message,
    ].filter(Boolean).join('\n');
    const event = {
      source: 'smre.info',
      system: 'SMRE Website',
      type: eventType,
      message: eventMessage,
      sourceUrl: `https://www.smre.info${sourcePage || ''}`,
      person: {
        firstName,
        lastName,
        ...(email ? { emails: [{ value: email }] } : {}),
        ...(phone ? { phones: [{ value: phone }] } : {}),
        ...(lead.address ? { addresses: [{ street: String(lead.address) }] } : {}),
      },
    };

    const response = await fetch('https://api.followupboss.com/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-System': 'SMRE Website',
        'X-System-Key': systemKey,
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(event),
    });

    let fubPersonId: number | null = null;
    if (response.status !== 204) {
      const responseText = await response.text();
      if (!response.ok) {
        console.error('FUB lead submission failed', response.status, responseText.slice(0, 500));
        return NextResponse.json({ error: 'Unable to submit your request. Please call (785) 465-2543.' }, { status: 502 });
      }
      try {
        const fubResult = JSON.parse(responseText);
        const returnedId = Number(fubResult?.id ?? fubResult?.person?.id);
        if (Number.isSafeInteger(returnedId) && returnedId > 0) fubPersonId = returnedId;
      } catch {
        // FUB accepted the inquiry, but without a returned contact ID we cannot
        // safely associate future browsing activity with a specific profile.
      }
    } else {
      // A 204 means this source's lead flow is archived and ignored by FUB.
      console.error('FUB returned 204: SMRE Website lead flow is archived or ignored.');
      return NextResponse.json({ error: 'Follow Up Boss did not accept this request. Please call (785) 465-2543.' }, { status: 502 });
    }

    const archiveType = lead.type === 'showing'
      ? 'Showing Request'
      : lead.type === 'seller' || lead.type === 'valuation'
        ? 'Seller Inquiry'
        : lead.type === 'buyer'
          ? 'Buyer Inquiry'
          : 'Property Inquiry';

    try {
      await addLead({
        type: archiveType,
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: lead.address ? String(lead.address) : undefined,
        listingId: lead.listingId ? String(lead.listingId) : undefined,
        message: message || undefined,
      });
    } catch (archiveError) {
      console.error('Lead was accepted by Follow Up Boss but website archive failed:', archiveError);
    }

    const result = NextResponse.json({ ok: true, forwarded: true });
    if (fubPersonId) {
      try {
        result.cookies.set(FUB_IDENTITY_COOKIE, encryptFubPersonId(fubPersonId), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 180,
        });
      } catch (cookieError) {
        console.error('Unable to persist identified FUB visitor session:', cookieError);
      }
    }
    return result;
  } catch (error) {
    console.error('Lead submission error', error);
    return NextResponse.json({ error: 'Unable to submit your request. Please try again or call (785) 465-2543.' }, { status: 400 });
  }
}
