import { getListings } from '../lib/listings'; import { ListingsExplorer } from '../components/ListingsExplorer';
export const metadata={title:'Listings'};
export default async function Listings(){const items=await getListings(); return <section className="section container"><div className="page-intro"><p className="eyebrow">PROPERTY SEARCH</p><h1>Homes and properties for sale.</h1><p>Browse current SMRE listings from Sunflower MLS and FHAR MLS.</p></div><ListingsExplorer items={items}/></section>}
