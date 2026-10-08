import { getListings } from '../lib/listings';
import { ListingsExplorer } from '../components/ListingsExplorer';
import { MLSDisclosure } from '../components/MLSDisclosure';

export const metadata = { title: 'Listings' };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ city?: string; address?: string; beds?: string; baths?: string; max?: string }>;

export default async function Listings({ searchParams }: { searchParams: SearchParams }) {
  const items = (await getListings()).map((p) => ({ ...p, Media: p.Media.slice(0, 1) }));
  const params = await searchParams;
  const initialFilters = {
    ...(params.city ? { city: params.city } : {}),
    ...(params.address ? { address: params.address } : {}),
    ...(params.beds ? { beds: params.beds } : {}),
    ...(params.baths ? { baths: params.baths } : {}),
    ...(params.max ? { max: params.max } : {}),
  };

  return (
    <section className="section container listings-page">
      <div className="page-intro">
        <p className="eyebrow">PROPERTY SEARCH</p>
        <h1>Find a property.</h1>
      </div>
      <ListingsExplorer items={items} initialFilters={initialFilters} />
      <MLSDisclosure />
    </section>
  );
}
