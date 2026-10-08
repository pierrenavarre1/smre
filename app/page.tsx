import Image from 'next/image';
import Link from 'next/link';
import { getListings, sortListingsByPriority } from './lib/listings';
import { ListingCard } from './components/ListingCard';
import { ListingMap } from './components/ListingMap';
import { ReviewsCarousel } from './components/ReviewsCarousel';
import { HomeLeadButtons } from './components/HomeLeadButtons';
import { HomeSearch } from './components/HomeSearch';
import { MLSDisclosure } from './components/MLSDisclosure';
import { getAdminData } from './lib/admin-store';

const heroImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=88';
const fallbackAreaImage = '/images/ChatGPT Image Sep 30, 2026, 02_28_25 PM.png';

export const revalidate = 60;

export default async function Home(){
  const activeListings=sortListingsByPriority((await getListings()).filter(p=>p.StandardStatus==='Active')).map((p) => ({ ...p, Media: p.Media.slice(0, 1) }));
  const {settings}=await getAdminData();
  const listings=activeListings.slice(0,settings.featuredCount||6);
  const headlineParts=settings.homepageHeadline.split(',');
  const headlineKicker=headlineParts.shift()?.trim()||'REAL ESTATE,';
  const headlineMain=headlineParts.join(',').trim()||'Close to Home.';
  const areaImage=settings.localImage||fallbackAreaImage;
  return <>
    <style>{`
      .home-hero-actions{display:flex;gap:10px;margin:-10px 0 30px;flex-wrap:wrap}
      .home-hero-actions .button{min-width:145px}
      @media(max-width:600px){.home-hero-actions{display:grid;grid-template-columns:1fr 1fr;width:100%;max-width:430px}.home-hero-actions .button{min-width:0;width:100%}}
      .home-listing-map{margin-top:52px}
      .home-rural-strip{padding:0;background:var(--navy);color:#fff}
      .home-rural-grid.home-rural-balanced{width:100%;max-width:none;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);min-height:500px}
      .home-rural-balanced .home-rural-photo{min-height:500px;overflow:hidden;position:relative}
      .home-rural-balanced .home-rural-photo img{object-fit:cover;object-position:center;width:100%;height:100%;display:block;image-rendering:auto}
      .home-rural-balanced .home-rural-copy{padding:78px clamp(44px,6vw,96px);display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
      .home-rural-balanced .home-rural-copy .eyebrow{color:#fff;opacity:.72;margin:0 0 16px}
      .home-rural-balanced .home-rural-copy h2{font-family:var(--serif);font-size:clamp(40px,4vw,56px);line-height:1.04;font-weight:400;letter-spacing:-.04em;margin:0 0 24px;max-width:600px}
      .home-rural-balanced .home-rural-copy p:not(.eyebrow){color:#fff;opacity:.82;font-size:16px;line-height:1.7;max-width:570px;margin:0 0 32px}
      .home-rural-balanced .home-rural-copy .button{align-self:flex-start}
      @media(max-width:800px){
        .home-listing-map{margin-top:38px}
        .home-rural-grid.home-rural-balanced{grid-template-columns:1fr}
        .home-rural-balanced .home-rural-photo{min-height:320px;max-height:420px}
        .home-rural-balanced .home-rural-copy{padding:52px 28px 60px}
      }
    `}</style>
    <section className="home-hero">
      <Image src={heroImage} alt="Kansas countryside and open fields" fill priority sizes="100vw" className="home-hero-image" />
      <div className="home-hero-overlay" />
      <div className="container home-hero-inner">
        <p className="eyebrow">{settings.heroEyebrow}</p>
        <h1><span className="hero-heading-kicker">{headlineKicker}{headlineParts.length||settings.homepageHeadline.includes(",")?",":""}</span><span className="hero-heading-main">{headlineMain}</span></h1>
        <p className="hero-copy">{settings.heroDescription}</p>
        <HomeLeadButtons />
        <HomeSearch items={activeListings} />
      </div>
    </section>

    <section className="section container">
      <div className="section-head"><div><p className="eyebrow">CURRENT LISTINGS</p><h2>Homes and properties in the area.</h2></div><Link href="/listings" className="text-link">See all listings →</Link></div>
      <div className="featured-grid home-featured-grid">{listings.map(p=><ListingCard key={p.ListingId} p={p}/>)}</div><div className="home-all-listings-link"><Link href="/listings" className="button button-dark">See all listings</Link></div>
      {activeListings.length>0&&<div className="home-listing-map"><ListingMap listings={activeListings}/></div>}
    </section>

    <section className="home-rural-strip">
      <div className="home-rural-grid home-rural-balanced">
        <div className="home-rural-photo"><img src={areaImage} alt="Kansas farm at sunset with a barn, fields and a country road" loading="lazy" /></div>
        <div className="home-rural-copy"><p className="eyebrow">THE AREA WE KNOW</p><h2>{settings.localHeading}</h2><p>{settings.localDescription}</p><Link href="/about" className="button button-light">About SMRE</Link></div>
      </div>
    </section>

    <section className="section container cta-grid">
      <Link href="/valuation" className="cta-card"><span className="eyebrow">SELLING</span><h3>What is your home worth in today’s market?</h3><span className="text-link">Request a home value →</span></Link>
      <Link href="/contact" className="cta-card"><span className="eyebrow">BUYING OR SELLING</span><h3>Have a property, a question, or a plan?</h3><span className="text-link">Talk with SMRE →</span></Link>
    </section>

    <ReviewsCarousel />
    <MLSDisclosure />
  </>;
}
