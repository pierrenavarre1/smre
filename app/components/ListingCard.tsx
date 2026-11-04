import Link from 'next/link';
import type { RESOProperty } from '../lib/mock-properties';
import { SourceBadge } from './MLSDisclosure';

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
function formatListingDate(value?: string) {
  if (!value) return '';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? dateFormatter.format(new Date(timestamp)) : value;
}

export function ListingCard({ p }: { p: RESOProperty }) {
  const baths = p.BathroomsTotalInteger || p.BathroomsFull || 0;
  const bathCount = baths + (p.BathroomsHalf ? 0.5 : 0);
  const acreage = p.LotSizeAcres || (p.LotSizeSqFt ? p.LotSizeSqFt / 43560 : 0);
  const photo = (p.Media.find(m => m.PreferredPhoto) || p.Media[0])?.MediaURL;
  const photoSrc = photo ? `/api/mls-image?url=${encodeURIComponent(photo)}&listingId=${encodeURIComponent(p.ListingId)}&index=0` : '';

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
        <div className="facts">{p.BedroomsTotal} beds{bathCount > 0 ? ` · ${bathCount} baths` : ''}{p.LivingArea ? ` · ${p.LivingArea.toLocaleString()} sqft` : ''}{acreage > 0 ? ` · ${acreage.toLocaleString(undefined,{maximumFractionDigits:2})}-acre lot` : p.LotSizeSqFt ? ` · ${p.LotSizeSqFt.toLocaleString()} sq ft lot` : ''}</div>
        <div>{p.StreetNumber} {p.StreetName}, {p.City}, KS {p.PostalCode}</div>
        {p.ListingDate ? <div className="listing-date">Listed {formatListingDate(p.ListingDate)}</div> : null}
        <div className="listing-idx-meta">
          <span>{p.StandardStatus}</span>
          {p.ListOfficeName ? <span>{p.ListOfficeName}</span> : null}
        </div>
      </div>
    </Link>
  );
}
