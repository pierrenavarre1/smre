import { getListings } from '../lib/listings';
import { ListingsExplorer } from '../components/ListingsExplorer';
import { MLSDisclosure } from '../components/MLSDisclosure';

export const metadata = { title: 'Listings' };
export const dynamic = 'force-dynamic';
export const revalidate = 60;

const INITIAL_MAP_TILE = 'https://tile.openstreetmap.org/12/954/1562.png';

export default async function Listings({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [listings, params] = await Promise.all([getListings(), searchParams]);
  // The unfiltered listings map starts at SERVICE_AREA_DEFAULT (39.1947, -96.0715, z12).
  // Preload only its nearest-to-center OSM tile; filtered views choose a different center client-side.
  const preloadInitialMapTile = listings.length > 1 && Object.keys(params).length === 0;

  // The explorer only needs one MLS-selected preview image per card/map marker.
  // The individual listing page reads the full media set independently.
  const items = listings.slice(0, 24).map((p) => {
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
    <>
      {preloadInitialMapTile && <link rel="preload" as="image" href={INITIAL_MAP_TILE} fetchPriority="high" />}
      <section className="section container listings-page">
      <div className="page-intro">
        <p className="eyebrow">PROPERTY SEARCH</p>
        <h1>Find a property.</h1>
      </div>
      <ListingsExplorer items={items} />
      <MLSDisclosure />
      </section>
    </>
  );
}
