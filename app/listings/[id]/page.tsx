import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getListing } from '../../lib/listings';
import { MLSDisclosure, SourceBadge } from '../../components/MLSDisclosure';

const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const number = new Intl.NumberFormat('en-US');

function DetailItem({label,value}:{label:string,value?:string|number}){if(value===undefined||value==='')return null;return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>}

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getListing(id);
  if (!p) notFound();
  const photos=p.Media.filter(m=>m.MediaCategory==='Photo');
  const baths=p.BathroomsTotalInteger+(p.BathroomsHalf?0.5:0);
  return <section className="section container detail">
    <Link href="/listings" className="back">← All listings</Link>
    <div className="gallery">
      <div className="gallery-main"><Image src={photos[0]?.MediaURL} alt={`${p.StreetNumber} ${p.StreetName}, ${p.City}`} fill sizes="(max-width:900px) 100vw, 66vw" priority /></div>
      <div className="gallery-side">{photos.slice(1,5).map(media=><div key={media.MediaKey}><Image src={media.MediaURL} alt={`${p.StreetNumber} ${p.StreetName} property photo`} fill sizes="(max-width:900px) 50vw, 33vw" /></div>)}</div>
    </div>
    <div className="detail-grid">
      <div>
        <div className="card-top"><p className="eyebrow">{p.StandardStatus}</p><SourceBadge source={p.MlsSource}/></div>
        <h1>{money.format(p.ListPrice)}</h1>
        <h2 className="detail-address">{p.StreetNumber} {p.StreetName}, {p.City}, KS {p.PostalCode}</h2>
        <div className="detail-facts"><b>{p.BedroomsTotal}</b> beds <b>{baths}</b> baths {p.LivingArea>0&&<><b>{number.format(p.LivingArea)}</b> sq ft</>} {p.LotSizeAcres>0&&<><b>{p.LotSizeAcres}</b> acres</>}</div>
        <p className="description">{p.PublicRemarks}</p>
        {p.Features?.length?<div className="feature-list">{p.Features.map(f=><span key={f}>{f}</span>)}</div>:null}
        <div className="details-section"><p className="eyebrow">PROPERTY DETAILS</p><div className="detail-items">
          <DetailItem label="Property type" value={`${p.PropertyType} · ${p.PropertySubType}`} /><DetailItem label="Year built" value={p.YearBuilt} /><DetailItem label="Living area" value={p.LivingArea?`${number.format(p.LivingArea)} sq ft`:undefined}/><DetailItem label="Lot size" value={p.LotSizeSqFt?`${number.format(p.LotSizeSqFt)} sq ft${p.LotSizeAcres?` · ${p.LotSizeAcres} acres`:''}`:undefined}/><DetailItem label="Price / sq ft" value={p.PricePerSqFt?money.format(p.PricePerSqFt):undefined}/><DetailItem label="Annual taxes" value={p.AnnualTaxes?money.format(p.AnnualTaxes):undefined}/><DetailItem label="Garage / parking" value={p.GarageSpaces!==undefined?`${p.GarageSpaces} spaces${p.ParkingFeatures?` · ${p.ParkingFeatures}`:''}`:p.ParkingFeatures}/><DetailItem label="Basement" value={p.Basement}/><DetailItem label="Foundation" value={p.Foundation}/><DetailItem label="Roof" value={p.Roof}/><DetailItem label="Exterior" value={p.Exterior}/><DetailItem label="Flooring" value={p.Flooring}/><DetailItem label="Appliances" value={p.Appliances}/><DetailItem label="Heating" value={p.Heating}/><DetailItem label="Cooling" value={p.Cooling}/><DetailItem label="Water" value={p.WaterSource}/><DetailItem label="Sewer" value={p.Sewer}/><DetailItem label="HOA" value={p.HOA}/><DetailItem label="Schools" value={p.Schools}/><DetailItem label="Other structures" value={p.OtherStructures}/><DetailItem label="Architectural style" value={p.ArchitecturalStyle}/><DetailItem label="Listing date" value={p.ListingDate}/><DetailItem label="MLS number" value={p.MLSNumber}/><DetailItem label="Parcel number" value={p.ParcelNumber}/>
        </div></div>
        {p.Directions?<div className="details-section"><p className="eyebrow">DIRECTIONS</p><p>{p.Directions}</p></div>:null}
        <div className="map-placeholder">Map location<br/><small>Map integration can be added without exposing MLS credentials client-side.</small></div>
        <MLSDisclosure />
      </div>
      <aside className="contact-card"><p className="eyebrow">LISTING CONTACT</p><h3>{p.ListAgentFullName}</h3><p>St. Mary’s Real Estate · {p.MlsSource}</p><Link className="button button-dark" href={`/contact?listing=${p.ListingId}`}>Ask about this property</Link></aside>
    </div>
  </section>;
}
