import { getListings } from '../lib/listings';
import { ListingsExplorer } from '../components/ListingsExplorer';
import { MLSDisclosure } from '../components/MLSDisclosure';

export const metadata = { title: 'Listings' };
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function Listings() {
  const listings = await getListings();

  // The explorer only needs one MLS-selected preview image per card/map marker.
  // The individual listing page reads the full media set independently.
  const items = listings.map((p) => {
    const preview = p.Media.find((photo) => photo.PreferredPhoto) || p.Media[0];
    return {
      ListingId: p.ListingId,
      StandardStatus: p.StandardStatus,
      ListPrice: p.ListPrice,
      BedroomsTotal: p.BedroomsTotal,
      BathroomsTotalInteger: p.BathroomsTotalInteger,
      BathroomsFull: p.BathroomsFull,
      BathroomsHalf: p.BathroomsHalf,
      PropertyType: p.PropertyType,
      StreetNumber: p.StreetNumber,
      StreetName: p.StreetName,
      City: p.City,
      StateOrProvince: p.StateOrProvince,
      PostalCode: p.PostalCode,
      LivingArea: p.LivingArea,
      LotSizeAcres: p.LotSizeAcres,
      LotSizeSqFt: p.LotSizeSqFt,
      Media: preview ? [preview] : [],
      ListOfficeName: p.ListOfficeName,
      MlsSource: p.MlsSource,
      Latitude: p.Latitude,
      Longitude: p.Longitude,
      ListingDate: p.ListingDate,
      ModificationTimestamp: p.ModificationTimestamp,
    };
  });

  return (
    <section className="section container listings-page">
      <div className="page-intro">
        <p className="eyebrow">PROPERTY SEARCH</p>
        <h1>Find a property.</h1>
      </div>
      <ListingsExplorer items={items} />
      <MLSDisclosure />
    </section>
  );
}
