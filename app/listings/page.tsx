import { getListings } from '../lib/listings';
import { ListingsExplorer } from '../components/ListingsExplorer';

export const metadata={title:'Listings'};

type SearchParams = Promise<{ city?: string; beds?: string; baths?: string; max?: string }>;

export default async function Listings({ searchParams }: { searchParams: SearchParams }) {
  const items=await getListings();
  const params=await searchParams;
  const initialFilters={
    ...(params.city ? { city: params.city } : {}),
    ...(params.beds ? { beds: params.beds } : {}),
    ...(params.baths ? { baths: params.baths } : {}),
    ...(params.max ? { max: params.max } : {}),
  };
  return <section className="section container"><div className="page-intro"><p className="eyebrow">PROPERTY SEARCH</p><h1>Homes and properties for sale.</h1><p>Browse current SMRE listings from Sunflower MLS and FHAR MLS.</p></div><ListingsExplorer items={items} initialFilters={initialFilters}/></section>;
}
