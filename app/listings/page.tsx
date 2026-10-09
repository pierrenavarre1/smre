import { getListings } from '../lib/listings';
import { ListingsExplorer } from '../components/ListingsExplorer';
import { MLSDisclosure } from '../components/MLSDisclosure';

export const metadata = { title: 'Listings' };
export const revalidate = 60;

export default async function Listings() {
  const listings = await getListings();

  // The explorer only needs one MLS-selected preview image per card/map marker.
  // The individual listing page reads the full media set independently.
  const items = listings.map((p) => {
    const preview = p.Media.find((photo) => photo.PreferredPhoto) || p.Media[0];
    return { ...p, Media: preview ? [preview] : [] };
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
