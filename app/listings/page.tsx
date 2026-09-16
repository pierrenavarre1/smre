import { getListings } from '../lib/listings';
import { ListingsExplorer } from '../components/ListingsExplorer';

export const metadata={title:'Listings'};

type SearchParams = Promise<{ city?: string; beds?: string; baths?: string; max?: string }>;

export default async function Listings({ searchParams }: { searchParams: SearchParams }) {
  const items=(await getListings()).filter(p=>p.StandardStatus==='Active');
  const params=await searchParams;
  const initialFilters={
    ...(params.city ? { city: params.city } : {}),
    ...(params.beds ? { beds: params.beds } : {}),
    ...(params.baths ? { baths: params.baths } : {}),
    ...(params.max ? { max: params.max } : {}),
  };
  return <section className="section container"><div className="page-intro"><p className="eyebrow">PROPERTY SEARCH</p><h1>All available homes and properties.</h1><p>Browse the active listings returned from Sunflower MLS and FHAR MLS across the St. Marys, Wamego and surrounding Northeast Kansas market.</p></div><ListingsExplorer items={items} initialFilters={initialFilters}/></section>;
}
