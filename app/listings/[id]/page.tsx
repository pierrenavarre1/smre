import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getListing, getListingForMetadata } from '../../lib/listings';
import { fetchFreshMediaForListing } from '../../lib/mlsgrid';
import { listingHref } from '../../lib/listing-url';
import { MLSDisclosure, SourceBadge, MLS_OFFICE, MLS_PHONE } from '../../components/MLSDisclosure';
import { ListingGallery } from '../../components/ListingGallery';
import { ListingLeadButton } from '../../components/ListingLeadButton';
import { ListingMap } from '../../components/ListingMap';

const SITE_URL = process.env.VERCEL_ENV === 'production' ? 'https://www.smre.info' : `https://${process.env.VERCEL_URL || 'www.smre.info'}`;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingForMetadata(id);
  if (!listing) return { title: 'Property Listing', description: 'View property listings from St. Mary’s Real Estate.' };

  const address = [listing.StreetNumber, listing.StreetName].filter(Boolean).join(' ');
  const location = [listing.City, listing.StateOrProvince || 'KS', listing.PostalCode].filter(Boolean).join(', ');
  const title = [address, location].filter(Boolean).join(', ');
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(listing.ListPrice);
  const remarks = String(listing.PublicRemarks || '').replace(/<[^>]*>/g, ' ').replace(/\\*\\*/g, '').replace(/\\s+/g, ' ').trim();
  const description = [price, remarks].filter(Boolean).join(' · ').slice(0, 240) || `View this property in ${location} with St. Mary’s Real Estate.`;
  const photo = listing.Media?.find(item => item.PreferredPhoto) || listing.Media?.[0];
  let image: string | undefined;
  if (photo?.MediaURL) {
    image = photo.MediaURL.startsWith('smre-blob:')
      ? `${SITE_URL}/api/mls-image?url=${encodeURIComponent(photo.MediaURL)}`
      : photo.MediaURL;
  }
  const url = `${SITE_URL}${listingHref(listing)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: 'St. Mary’s Real Estate',
      title,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {})
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {})
    }
  };
}

const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
function formatListingDate(value?: string) {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? date.format(new Date(parsed)) : value;
}
function DetailItem({label,value}:{label:string,value?:string|number}){if(value===undefined||value==='')return null;return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>}

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getListing(id);
  if (!p) notFound();
  // Detail records in the shared listing cache intentionally keep only one preview photo.
  // Retrieve the full, ordered media list here, using the shared MLS request limiter.
  const fullMedia = await fetchFreshMediaForListing(p);
  const photos=fullMedia.filter(m=>m.MediaCategory==='Photo');
  const baths=(p.BathroomsTotalInteger || p.BathroomsFull || 0)+(p.BathroomsHalf?0.5:0);
  const acreage=p.LotSizeAcres || (p.LotSizeSqFt ? p.LotSizeSqFt/43560 : 0);
  return <section className="section container detail">
    <Link href="/listings" className="back">← All listings</Link>
    <ListingGallery photos={photos} address={`${p.StreetNumber} ${p.StreetName}, ${p.City}`} listingId={p.ListingId} />
    <div className="detail-grid">
      <div>
        <div className="card-top"><p className="eyebrow">{p.StandardStatus}</p><SourceBadge source={p.MlsSource}/></div>
        <h1>{money.format(p.ListPrice)}</h1>
        <h2 className="detail-address">{p.StreetNumber} {p.StreetName}, {p.City}, KS {p.PostalCode}</h2>
        <div className="detail-facts"><b>{p.BedroomsTotal}</b> beds {baths>0&&<><b>{baths}</b> baths</>} {p.LivingArea>0&&<><b>{number.format(p.LivingArea)}</b> sqft</>} {acreage>0&&<><b>{acreage.toLocaleString(undefined,{maximumFractionDigits:2})}</b> acres</>}{acreage<=0&&(p.LotSizeSqFt ?? 0)>0&&<><b>{number.format(p.LotSizeSqFt ?? 0)}</b> sq ft lot</>}</div>
        <p className="description">{p.PublicRemarks}</p>
        <aside className="contact-card listing-contact-inline"><p className="eyebrow">CONTACT AN AGENT</p><h3>{MLS_OFFICE}</h3><p>Have questions about this property or want to schedule a showing? A St. Mary’s Real Estate agent can help.</p><p className="listing-contact-meta"><strong>{p.StandardStatus}</strong> · MLS # {p.MLSNumber || p.ListingId}</p><p className="listing-contact-phone">{MLS_PHONE}</p><ListingLeadButton address={`${p.StreetNumber} ${p.StreetName}, ${p.City}, KS ${p.PostalCode}`} listingId={p.ListingId} /></aside>
        
        {p.Features?.length?<div className="feature-list">{p.Features.map(f=><span key={f}>{f}</span>)}</div>:null}
        <div className="details-section"><p className="eyebrow">PROPERTY DETAILS</p><div className="detail-items">
          <DetailItem label="Property type" value={`${p.PropertyType} · ${p.PropertySubType}`} /><DetailItem label="Year built" value={p.YearBuilt} /><DetailItem label="Living area" value={p.LivingArea?`${number.format(p.LivingArea)} sq ft`:undefined}/><DetailItem label="Lot size" value={p.LotSizeSqFt?`${number.format(p.LotSizeSqFt)} sq ft${p.LotSizeAcres?` · ${p.LotSizeAcres} acres`:''}`:undefined}/><DetailItem label="Price / sq ft" value={p.PricePerSqFt?money.format(p.PricePerSqFt):undefined}/><DetailItem label="Annual taxes" value={p.AnnualTaxes?money.format(p.AnnualTaxes):undefined}/><DetailItem label="Garage / parking" value={p.GarageSpaces!==undefined?`${p.GarageSpaces} spaces${p.ParkingFeatures?` · ${p.ParkingFeatures}`:''}`:p.ParkingFeatures}/><DetailItem label="Basement" value={p.Basement}/><DetailItem label="Foundation" value={p.Foundation}/><DetailItem label="Roof" value={p.Roof}/><DetailItem label="Exterior" value={p.Exterior}/><DetailItem label="Flooring" value={p.Flooring}/><DetailItem label="Appliances" value={p.Appliances}/><DetailItem label="Heating" value={p.Heating}/><DetailItem label="Cooling" value={p.Cooling}/><DetailItem label="Water" value={p.WaterSource}/><DetailItem label="Sewer" value={p.Sewer}/><DetailItem label="HOA" value={p.HOA}/><DetailItem label="Schools" value={p.Schools}/><DetailItem label="Other structures" value={p.OtherStructures}/><DetailItem label="Architectural style" value={p.ArchitecturalStyle}/><DetailItem label="Listing date" value={formatListingDate(p.ListingDate)}/><DetailItem label="MLS number" value={p.MLSNumber}/><DetailItem label="Parcel number" value={p.ParcelNumber}/>
        </div></div>
        {(p.ListOfficeName || p.ListAgentFullName || p.ListAgentEmail || p.ListAgentDirectPhone || p.ListOfficeEmail || p.ListOfficePhone) ? <p className="listing-agency listing-attribution">{p.ListOfficeName ? `Listed by ${p.ListOfficeName}` : null}{p.ListAgentFullName ? <> · Listing agent: {p.ListAgentFullName}</> : null}{p.ListAgentEmail ? <> · <a href={`mailto:${p.ListAgentEmail}`}>{p.ListAgentEmail}</a></> : p.ListAgentDirectPhone ? <> · <a href={`tel:${p.ListAgentDirectPhone}`}>{p.ListAgentDirectPhone}</a></> : p.ListOfficeEmail ? <> · <a href={`mailto:${p.ListOfficeEmail}`}>{p.ListOfficeEmail}</a></> : p.ListOfficePhone ? <> · <a href={`tel:${p.ListOfficePhone}`}>{p.ListOfficePhone}</a></> : null}</p> : null}
        {p.Directions?<div className="details-section"><p className="eyebrow">DIRECTIONS</p><p>{p.Directions}</p></div>:null}
        <div className="detail-map"><ListingMap listings={[p]} /></div>
        <MLSDisclosure source={p.MlsSource}/>
      </div>
      <aside className="contact-card listing-contact-desktop"><p className="eyebrow">CONTACT AN AGENT</p><h3>{MLS_OFFICE}</h3><p>Have questions about this property or want to schedule a showing? A St. Mary’s Real Estate agent can help.</p><p className="listing-contact-meta"><strong>{p.StandardStatus}</strong> · MLS # {p.MLSNumber || p.ListingId}</p><p className="listing-contact-phone">{MLS_PHONE}</p><ListingLeadButton address={`${p.StreetNumber} ${p.StreetName}, ${p.City}, KS ${p.PostalCode}`} listingId={p.ListingId} /></aside>
    </div>
  </section>;
}