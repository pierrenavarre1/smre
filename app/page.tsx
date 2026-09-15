import Link from 'next/link';
import { getListings } from './lib/listings';
import { ListingCard } from './components/ListingCard';

export default async function Home(){
  const listings=(await getListings()).slice(0,5);
  return <>
    <section className="hero">
      <div className="container hero-inner">
        <p className="eyebrow">ST. MARYS · WAMEGO · TOPEKA–MANHATTAN</p>
        <h1>Local real estate.<br />Clear representation.</h1>
        <p className="hero-copy">A locally focused brokerage for buying, selling, and making sound decisions about real estate.</p>
        <form action="/listings" className="search-panel">
          <input name="city" placeholder="City or area" aria-label="City or area" />
          <select name="beds" aria-label="Bedrooms"><option value="">Beds</option><option value="3">3+</option><option value="4">4+</option></select>
          <select name="max" aria-label="Maximum price"><option value="">Price</option><option value="300000">Up to $300k</option><option value="400000">Up to $400k</option><option value="500000">Up to $500k</option></select>
          <button className="button button-dark">Search homes</button>
        </form>
      </div>
    </section>

    <section className="section container">
      <div className="section-head"><div><p className="eyebrow">CURRENT LISTINGS</p><h2>Properties worth a look.</h2></div><Link href="/listings" className="text-link">View all listings →</Link></div>
      <div className="featured-grid">{listings.map((p,i)=><div className={i===0?'feature-large':''} key={p.ListingId}><ListingCard p={p}/></div>)}</div>
    </section>

    <section className="split-callout">
      <div className="container split">
        <div><p className="eyebrow">WHY SMRE</p><h2>Know the market.<br />Know the details.</h2></div>
        <div><p>SMRE serves St. Marys, Wamego, and the surrounding Topeka–Manhattan market. We keep the process direct, communicate clearly, and stay involved from the first conversation through closing.</p><Link href="/about" className="button button-light">About SMRE</Link></div>
      </div>
    </section>

    <section className="section container cta-grid">
      <Link href="/valuation" className="cta-card"><span className="eyebrow">SELLING</span><h3>Find out what your home is worth in today’s market.</h3><span className="text-link">Request a home value →</span></Link>
      <Link href="/contact" className="cta-card"><span className="eyebrow">BUYING OR SELLING</span><h3>Have a property, a question, or a plan?</h3><span className="text-link">Talk with SMRE →</span></Link>
    </section>
  </>;
}
