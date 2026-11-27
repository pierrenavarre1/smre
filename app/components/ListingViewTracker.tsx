'use client';
import { useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';
import { sendFubPropertyView } from '../lib/fub-activity-client';

export function ListingViewTracker({
  listingId, city, propertyType, street, state, postalCode, mlsNumber, price,
}: {
  listingId: string;
  city: string;
  propertyType: string;
  street: string;
  state: string;
  postalCode: string;
  mlsNumber: string;
  price: number;
}) {
  const sent = useRef(false);
  useEffect(() => {
    track('Listing View', { listingId, city, propertyType });
    if (sent.current) return;
    sent.current = true;
    sendFubPropertyView({
      street,
      city,
      state: state || 'KS',
      code: postalCode,
      mlsNumber: mlsNumber || listingId,
      price,
      url: window.location.href,
    });
  }, [listingId, city, propertyType, street, state, postalCode, mlsNumber, price]);
  return null;
}
