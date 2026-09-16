import Image from 'next/image';
import Link from 'next/link';
import { getListings } from './lib/listings';
import { ListingCard } from './components/ListingCard';
import { ListingMap } from './components/ListingMap';
import { ReviewsCarousel } from './components/ReviewsCarousel';
import { HomeLeadButtons } from './components/HomeLeadButtons';

const heroImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=88';
const areaImage = '/images/area-reference-hd.jpg';

export default async function Home(){
  const activeListings=(await getListings()).filter(p=>p.StandardStatus==='Active');
  const listings=activeListings.slice(0,6);
  return <>
    <style>{`\n      .home-hero-actions{display:flex;gap:10px;margin:-10px 0 30px;flex-wrap:wrap}\n      .home-hero-actions .button{min-width:145px}\n      @media(max-width:600px){.home-hero-actions{display:grid;grid-template-columns:1fr 1fr;width:100%;max-width:430px}.home-hero-actions .button{min-width:0;width:100%}}\n      .home-listing-map{margin-top:52px}\n      .listing-map-wrap{width:100%;border:1px solid #d9dce8;background:#fff;box-shadow:0 18px 50px rgba(15,20,71,.10);overflow:hidden}\n      .listing-map-toolbar{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 28px;border-bottom:1px solid #e5e7ee;background:#fff}\n      .listing-map-toolbar .eyebrow{margin:0 0 7px;color:#0f1447}\n      .listing-map-toolbar h3{margin:0;font-family:var(--serif);font-size:30px;line-height:1.05;font-weight:400;letter-spacing:-.025em;color:#0f1447}\n      .listing-map-toolbar span{display:block;margin-top:7px;color:#6a7082;font-size:13px}\n      .listing-map-controls{display:flex;align-items:center;gap:8px;flex-shrink:0}\n      .listing-map-controls button{width:40px;height:40px;border:1px solid #cfd3df;background:#fff;color:#0f1447;font-size:22px;line-height:1;cursor:pointer}\n      .listing-map-controls button:hover{background:#f2f3f8}\n      .listing-map-controls .map-reset{width:auto;padding:0 14px;font-size:13px;font-weight:600}\n      .listing-map{position:relative;width:100%;height:560px;overflow:hidden;background:#e8edf0;cursor:grab;touch-action:none;isolation:isolate}\n      .listing-map:active{cursor:grabbing}\n      .listing-map-tiles{position:absolute;inset:0;overflow:hidden;pointer-events:none}\n      .listing-map-tiles img{position:absolute;width:256px;height:256px;max-width:none;user-select:none}\n      .listing-map-markers{position:absolute;inset:0;pointer-events:none}\n      .listing-marker{position:absolute;transform:translate(-50%,-100%);width:38px;height:38px;border:0;border-radius:50% 50% 50% 0;background:#0f1447;color:#fff;box-shadow:0 5px 14px rgba(15,20,71,.28);rotate:-45deg;cursor:pointer;pointer-events:auto;display:grid;place-items:center;padding:0}\n      .listing-marker span{rotate:45deg;font-family:Arial,sans-serif;font-weight:700;font-size:15px}\n      .listing-marker:hover,.listing-marker.is-selected{background:#b78a3d;transform:translate(-50%,-100%) scale(1.1)}\n      .listing-map-card{position:absolute;left:24px;bottom:24px;width:min(330px,calc(100% - 48px));padding:22px 24px;background:#fff;color:#0f1447;box-shadow:0 14px 35px rgba(15,20,71,.22);z-index:5}\n      .listing-map-card-close{position:absolute;right:10px;top:8px;border:0;background:transparent;color:#555b6e;font-size:24px;cursor:pointer}\n      .listing-map-card .eyebrow{margin:0 0 5px;color:#6a7082}\n      .listing-map-card strong{display:block;font-family:var(--serif);font-size:29px;font-weight:400;margin-bottom:5px}\n      .listing-map-card span{display:block;font-size:13px;color:#555b6e;line-height:1.5}\n      .listing-map-card a{display:inline-block;margin-top:14px;color:#0f1447;font-weight:700;font-size:13px;text-decoration:none}\n      .listing-map-hint{position:absolute;left:50%;top:18px;transform:translateX(-50%);z-index:3;padding:7px 12px;background:rgba(255,255,255,.92);color:#53596b;font-size:11px;letter-spacing:.02em;box-shadow:0 3px 12px rgba(0,0,0,.08);pointer-events:none}\n      .listing-map-attribution{position:absolute;right:7px;bottom:4px;z-index:6;padding:2px 5px;background:rgba(255,255,255,.86);color:#444;font-size:10px;pointer-events:none}\n      .home-rural-strip{padding:0;background:var(--navy);color:#fff}\n      .home-rural-grid.home-rural-balanced{width:100%;max-width:none;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);min-height:500px}\n      .home-rural-balanced .home-rural-photo{min-height:500px;overflow:hidden;position:relative}\n      .home-rural-balanced .home-rural-photo img{object-fit:cover;object-position:center;width:100%;height:100%;display:block;image-rendering:auto}\n      .home-rural-balanced .home-rural-copy{padding:78px clamp(44px,6vw,96px);display:flex;flex-direction:column;justify-content:center;align-items:flex-start}\n      .home-rural-balanced .home-rural-copy .eyebrow{color:#fff;opacity:.72;margin:0 0 16px}\n      .home-rural-balanced .home-rural-copy h2{font-family:var(--serif);font-size:clamp(40px,4vw,56px);line-height:1.04;font-weight:400;letter-spacing:-.04em;margin:0 0 24px;max-width:600px}\n      .home-rural-balanced .home-rural-copy p:not(.eyebrow){color:#fff;opacity:.82;font-size:16px;line-height:1.7;max-width:570px;margin:0 0 32px}\n      .home-rural-balanced .home-rural-copy .button{align-self:flex-start}\n      @media(max-width:800px){\n        .home-listing-map{margin-top:38px}\n        .listing-map-toolbar{padding:20px;align-items:flex-start}\n        .listing-map-toolbar h3{font-size:25px}\n        .listing-map-controls .map-reset{display:none}\n        .listing-map{height:460px}\n        .listing-map-hint{top:auto;bottom:28px;left:50%;white-space:nowrap}\n        .home-rural-grid.home-rural-balanced{grid-template-columns:1fr}\n        .home-rural-balanced .home-rural-photo{min-height:320px;max-height:420px}\n        .home-rural-balanced .home-rural-copy{padding:52px 28px 60px}\n      }\n      @media(max-width:520px){.listing-map-toolbar{gap:12px}.listing-map-toolbar h3{font-size:22px}.listing-map-controls button{width:36px;height:36px}.listing-map-card{left:14px;bottom:14px;width:calc(100% - 28px)}}\n    `}</style>
    <section className="home-hero">
      <Image src={heroImage} alt="Kansas countryside and open fields" fill priority sizes="100vw" className="home-hero-image" />
      <div className="home-hero-overlay" />
      <div className="container home-hero-inner">
        <p className="eyebrow">ST. MARYS · WAMEGO · TOPEKA–MANHATTAN</p>
        <h1>BUYING OR SELLING?<br />START HERE.</h1>
        <p className="hero-copy">St. Mary’s Real Estate helps buyers and sellers throughout the area with local knowledge, strong connections, and straightforward advice.</p>
        <HomeLeadButtons />
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
      {activeListings.length>0&&<div className="home-listing-map"><ListingMap listings={activeListings}/></div>}
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
