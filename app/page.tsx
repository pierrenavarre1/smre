import Image from 'next/image';
import Link from 'next/link';
import { getListings } from './lib/listings';
import { ListingCard } from './components/ListingCard';
import { ReviewsCarousel } from './components/ReviewsCarousel';

const heroImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=88';
const areaImage = 'https://images.stockcake.com/public/d/a/6/da63eee3-b227-4786-be17-412654f82f76_large/idyllic-farm-aerial-stockcake.jpg';

export default async function Home(){
  const listings=(await getListings()).filter(p=>p.StandardStatus==='Active').slice(0,6);
  return <>
    <style>{`\n      .home-rural-strip{padding:0;background:var(--navy);color:#fff}\n      .home-rural-grid.home-rural-balanced{width:100%;max-width:none;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);min-height:500px}\n      .home-rural-balanced .home-rural-photo{min-height:500px;overflow:hidden;position:relative}\n      .home-rural-balanced .home-rural-photo img{object-fit:cover;object-position:center;width:100%;height:100%;display:block;image-rendering:auto}\n      .home-rural-balanced .home-rural-copy{padding:78px clamp(44px,6vw,96px);display:flex;flex-direction:column;justify-content:center;align-items:flex-start}\n      .home-rural-balanced .home-rural-copy .eyebrow{color:#fff;opacity:.72;margin:0 0 16px}\n      .home-rural-balanced .home-rural-copy h2{font-family:var(--serif);font-size:clamp(40px,4vw,56px);line-height:1.04;font-weight:400;letter-spacing:-.04em;margin:0 0 24px;max-width:600px}\n      .home-rural-balanced .home-rural-copy p:not(.eyebrow){color:#fff;opacity:.82;font-size:16px;line-height:1.7;max-width:570px;margin:0 0 32px}\n      .home-rural-balanced .home-rural-copy .button{align-self:flex-start}\n      @media(max-width:800px){\n        .home-rural-grid.home-rural-balanced{grid-template-columns:1fr}\n        .home-rural-balanced .home-rural-photo{min-height:320px;max-height:420px}\n        .home-rural-balanced .home-rural-copy{padding:52px 28px 60px}\n      }\n    `}</style>
    <section className="home-hero">
      <Image src={heroImage} alt="Kansas countryside and open fields" fill priority sizes="100vw" className="home-hero-image" />
      <div className="home-hero-overlay" />
      <div className="container home-hero-inner">
        <p className="eyebrow">ST. MARYS · WAMEGO · TOPEKA–MANHATTAN</p>
        <h1>Real estate,<br />done locally.</h1>
        <p className="hero-copy">Good property advice starts with knowing the place. SMRE brings local knowledge, straightforward representation, and attention to the details that matter.</p>
        <form action="/listings" className="search-panel home-search">
          <input name="city" placeholder="City or area" aria-label="City or area" />
          <select name="beds" aria-label="Bedrooms"><option value="">Beds</option><option value="1">1+ beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option><option value="5">5+ beds</option></select>
          <select name="baths" aria-label="Bathrooms"><option value="">Baths</option><option value="1">1+ baths</option><option value="1.5">1.5+ baths</option><option value="2">2+ baths</option><option value="2.5">2.5+ baths</option><option value="3">3+ baths</option><option value="4">4+ baths</option></select>
          <select name="max" aria-label="Maximum price"><option value="">Price</option><option value="200000">Up to $200k</option><option value="300000">Up to $300k</option><option value="400000">Up to $400k</option><option value="500000">Up to $500k</option><option value="750000">Up to $750k</option><option value="1000000">Up to $1M</option></select>
          <button className="button button-dark">Search homes</button>
        </form>
      </div>
    </section>

    <section className="section container">
      <div className="section-head"><div><p className="eyebrow">CURRENT LISTINGS</p><h2>Homes and properties in the area.</h2></div><Link href="/listings" className="text-link">See all listings →</Link></div>
      <div className="featured-grid home-featured-grid">{listings.map(p=><ListingCard key={p.ListingId} p={p}/>)}</div>
    </section>

    <section className="home-rural-strip">
      <div className="home-rural-grid home-rural-balanced">
        <div className="home-rural-photo"><img src={areaImage} alt="Aerial view of a Midwestern farm with a farmhouse, pond, pasture, barn and country road" loading="lazy" /></div>
        <div className="home-rural-copy"><p className="eyebrow">THE AREA WE KNOW</p><h2>Small towns. Open country. Real local knowledge.</h2><p>From St. Marys and Wamego to the farms, acreage, and communities between Topeka and Manhattan, we understand that buying here is about more than an address.</p><Link href="/about" className="button button-light">About SMRE</Link></div>
      </div>
    </section>

    <section className="section container cta-grid">
      <Link href="/valuation" className="cta-card"><span className="eyebrow">SELLING</span><h3>What is your home worth in today’s market?</h3><span className="text-link">Request a home value →</span></Link>
      <Link href="/contact" className="cta-card"><span className="eyebrow">BUYING OR SELLING</span><h3>Have a property, a question, or a plan?</h3><span className="text-link">Talk with SMRE →</span></Link>
    </section>

    <ReviewsCarousel />
  </>;
}
