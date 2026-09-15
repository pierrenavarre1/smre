import Image from 'next/image';
import Link from 'next/link';
import { getListings } from './lib/listings';
import { ListingCard } from './components/ListingCard';

const heroImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=88';
const ruralHomeImage = 'https://images.unsplash.com/photo-1592351763700-b9b35a6465ea?auto=format&fit=crop&w=1200&q=88';

export default async function Home(){
  const listings=(await getListings()).filter(p=>p.StandardStatus==='Active').slice(0,4);
  return <>
    <section className="home-hero">
      <Image src={heroImage} alt="Kansas countryside and open fields" fill priority sizes="100vw" className="home-hero-image" />
      <div className="home-hero-overlay" />
      <div className="container home-hero-inner">
        <p className="eyebrow">ST. MARYS · WAMEGO · TOPEKA–MANHATTAN</p>
        <h1>Real estate,<br />done locally.</h1>
        <p className="hero-copy">Good property advice starts with knowing the place. SMRE brings local knowledge, straightforward representation, and attention to the details that matter.</p>
        <form action="/listings" className="search-panel home-search">
          <input name="city" placeholder="City or area" aria-label="City or area" />
          <select name="beds" aria-label="Bedrooms"><option value="">Beds</option><option value="3">3+</option><option value="4">4+</option></select>
          <select name="max" aria-label="Maximum price"><option value="">Price</option><option value="300000">Up to $300k</option><option value="400000">Up to $400k</option><option value="500000">Up to $500k</option></select>
          <button className="button button-dark">Search homes</button>
        </form>
      </div>
    </section>

    <section className="section container">
      <div className="section-head"><div><p className="eyebrow">CURRENT LISTINGS</p><h2>Homes and properties in the area.</h2></div><Link href="/listings" className="text-link">View all listings →</Link></div>
      <div className="featured-grid home-featured-grid">{listings.map(p=><ListingCard key={p.ListingId} p={p}/>)}</div>
    </section>

    <section className="home-rural-strip">
      <div className="container home-rural-grid">
        <div className="home-rural-photo"><Image src={ruralHomeImage} alt="Country home surrounded by open space" fill sizes="(max-width: 900px) 100vw, 55vw" /></div>
        <div className="home-rural-copy"><p className="eyebrow">THE AREA WE KNOW</p><h2>Small towns. Open country. Real local knowledge.</h2><p>From St. Marys and Wamego to the farms, acreage, and communities between Topeka and Manhattan, we understand that buying here is about more than an address.</p><Link href="/about" className="button button-light">About SMRE</Link></div>
      </div>
    </section>

    <section className="section container cta-grid">
      <Link href="/valuation" className="cta-card"><span className="eyebrow">SELLING</span><h3>What is your home worth in today’s market?</h3><span className="text-link">Request a home value →</span></Link>
      <Link href="/contact" className="cta-card"><span className="eyebrow">BUYING OR SELLING</span><h3>Have a property, a question, or a plan?</h3><span className="text-link">Talk with SMRE →</span></Link>
    </section>
  </>;
}
