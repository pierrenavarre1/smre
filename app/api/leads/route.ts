import { NextResponse } from 'next/server';
import { addLead } from '../../lib/admin-store';

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
    const message = String(lead?.message || lead?.details || '').trim();

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
        ? 'Showing Request'
        : lead.type === 'property'
          ? 'Property Inquiry'
          : 'General Inquiry';

    const event = {
      source: 'smre.info',
      system: 'SMRE Website',
      type: eventType,
      message: [
        lead.listingId ? `MLS/Listing ID: ${String(lead.listingId)}` : '',
        lead.address ? `Property address: ${String(lead.address)}` : '',
        lead.preferredDate ? `Preferred date: ${String(lead.preferredDate)}` : '',
        lead.preferredTime ? `Preferred time: ${String(lead.preferredTime)}` : '',
        message,
      ].filter(Boolean).join('\n'),
      sourceUrl: 'https://smre.info',
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

    if (!response.ok) {
      console.error('FUB lead submission failed', response.status, await response.text());
      return NextResponse.json({ error: 'Unable to submit your request. Please call (785) 465-2543.' }, { status: 502 });
    }

    await addLead({
      type: eventType,
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: lead.address ? String(lead.address) : undefined,
      listingId: lead.listingId ? String(lead.listingId) : undefined,
      message: message || undefined,
    });

    return NextResponse.json({ ok: true, forwarded: true });
  } catch (error) {
    console.error('Lead submission error', error);
    return NextResponse.json({ error: 'Unable to submit your request. Please try again or call (785) 465-2543.' }, { status: 400 });
  }
}
