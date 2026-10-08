import { getListings } from '../lib/listings';
import { ListingsExplorer } from '../components/ListingsExplorer';
import { MLSDisclosure } from '../components/MLSDisclosure';

export const metadata = { title: 'Listings' };
export const revalidate = 60;

export default async function Listings() {
  const items = await getListings();

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
