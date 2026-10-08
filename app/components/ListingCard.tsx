import Link from 'next/link';
import type { RESOProperty } from '../lib/mock-properties';
import { SourceBadge, MLS_OFFICE, MLS_PHONE } from './MLSDisclosure';

export function ListingCard({ p }: { p: RESOProperty }) {
  const baths = p.BathroomsTotalInteger + (p.BathroomsHalf ? 0.5 : 0);
  const photo = p.Media[0]?.MediaURL;
  const photoSrc = photo ? `/api/mls-image?url=${encodeURIComponent(photo)}` : '';

  return (
    <Link href={`/listings/${encodeURIComponent(p.ListingId)}`} className="listing-card">
      <div className="card-image">
        {photoSrc ? (
          <img className="listing-card-photo" src={photoSrc} alt={`${p.StreetNumber} ${p.StreetName}, ${p.City}`} loading="lazy" />
        ) : (
          <div className="card-image-placeholder">No photo available</div>
        )}
      </div>
      <div className="card-body">
        <div className="card-top">
          <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p.ListPrice)}</strong>
          <SourceBadge source={p.MlsSource} />
        </div>
        <div className="facts">{p.BedroomsTotal} bd · {baths} ba {p.LivingArea ? `· ${p.LivingArea.toLocaleString()} sq ft` : ''}</div>
        <div>{p.StreetNumber} {p.StreetName}, {p.City}, KS {p.PostalCode}</div>
        <div className="listing-idx-meta">
          <span>{p.StandardStatus}</span>
          <span>{MLS_OFFICE}</span>
          <span>MLS # {p.MLSNumber || p.ListingId}</span>
          <span>{MLS_PHONE}</span>
        </div>
      </div>
    </Link>
  );
}
