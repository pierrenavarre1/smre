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

const heroImage = '/images/Hero for SMRE Web.png';
const serviceAreas = [{name:'St. Marys',slug:'st-marys'},{name:'Wamego',slug:'wamego'},{name:'Rossville',slug:'rossville'},{name:'Silver Lake',slug:'silver-lake'},{name:'Manhattan',slug:'manhattan'},{name:'Topeka',slug:'topeka'}];

export const revalidate = 60;

export default async function Home(){
  const activeListings=sortListingsByPriority((await getListings()).filter(p=>p.StandardStatus==='Active')).map((p) => ({ ...p, Media: p.Media.slice(0, 1) }));
  const {settings,agents}=await getAdminData();
  const listings=activeListings.slice(0,settings.featuredCount||6);
  const headlineParts=settings.homepageHeadline.split(',');
  const headlineKicker=headlineParts.shift()?.trim()||'REAL ESTATE,';
  const headlineMain=headlineParts.join(',').trim()||'Close to Home.';
  const visibleAgents=agents.filter(agent=>!agent.hidden).sort((a,b)=>(a.sort??99)-(b.sort??99));
  const businessSchema={
    '@context':'https://schema.org',
    '@type':'RealEstateAgent',
    name:'St. Mary’s Real Estate',
    alternateName:'SMRE',
    url:'https://www.smre.info',
    telephone:'+1-785-465-2543',
    address:{'@type':'PostalAddress',streetAddress:'512 W Bertrand Ave',addressLocality:'St. Marys',addressRegion:'KS',postalCode:'66536',addressCountry:'US'},
    areaServed:serviceAreas.map(area=>({'@type':'City',name:area.name,containedInPlace:{'@type':'State',name:'Kansas'}})),
    employee:visibleAgents.map(agent=>({'@type':'RealEstateAgent',name:agent.name,jobTitle:agent.role,url:'https://www.smre.info/agents/'+agent.slug,telephone:agent.phone})),
    knowsAbout:['Residential real estate','Land and acreage','Rural properties','New construction','Commercial real estate','Real estate investments']
  };
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
      .home-rural-balanced .home-rural-copy h2{font-family:var(--serif);font-size:clamp(32px,3.2vw,44px);line-height:1.08;font-weight:400;letter-spacing:-.04em;margin:0 0 24px;max-width:600px}
      .home-rural-balanced .home-rural-copy p:not(.eyebrow){color:#fff;opacity:.82;font-size:16px;line-height:1.7;max-width:570px;margin:0 0 32px}
      .home-rural-balanced .home-rural-copy .button{align-self:flex-start}
      .home-story{background:var(--navy);color:#fff;padding:68px 0 46px}
      .home-story-grid{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:64px;align-items:center}
      .home-story-copy .eyebrow{color:#b8c8ed;margin-bottom:18px}
      .home-story-copy h2{font-family:var(--serif);font-size:clamp(36px,4.2vw,54px);font-weight:400;line-height:1.06;letter-spacing:-.04em;margin:0 0 22px;max-width:650px}
      .home-story-copy h2 em{color:#a9c4f2;font-weight:400}
      .home-story-copy p:not(.eyebrow){color:rgba(255,255,255,.84);font-size:16px;line-height:1.8;max-width:620px;margin:0 0 16px}
      .home-story-copy .button{margin-top:22px;padding:14px 24px;min-height:50px}
      .home-story-proof{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .home-story-proof article{border:1px solid rgba(255,255,255,.2);border-radius:14px;padding:24px;min-height:145px;display:flex;flex-direction:column;justify-content:center}
      .home-story-proof strong{font-family:var(--serif);font-size:clamp(29px,3vw,39px);font-weight:400;line-height:1.05;margin-bottom:9px}
      .home-story-proof span{font-size:14px;line-height:1.55;color:rgba(255,255,255,.92);font-weight:700}\n      .home-story-proof .proof-stars{color:#f4b400;letter-spacing:2px;font-size:16px;line-height:1.2;margin-left:7px;white-space:nowrap}\n      .home-story-proof .proof-rating{display:flex;align-items:center;flex-wrap:wrap}
      .home-seo-team{padding-top:48px;padding-bottom:42px}
      .home-cta-compact{padding-top:42px;padding-bottom:36px}
      .reviews-section.section{padding-top:46px;padding-bottom:64px}
      .home-seo-team h2{font-family:var(--serif);font-size:clamp(32px,4vw,44px);font-weight:400;line-height:1.12;letter-spacing:-.035em;margin:0}
      .home-seo-team-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
      .home-seo-agent{border:1px solid var(--line);color:var(--navy);text-decoration:none;display:flex;flex-direction:column;min-width:0;transition:transform .2s ease,box-shadow .2s ease}
      .home-seo-agent:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(15,20,71,.1)}
      .home-seo-agent-photo{position:relative;width:100%;aspect-ratio:4/4.5;background:var(--wash);overflow:hidden}
      .home-seo-agent-photo img{width:100%;height:100%;object-fit:cover;object-position:center 28%;display:block}
      .home-seo-agent-info{padding:18px 18px 20px}
      .home-seo-agent-info strong{display:block;font-family:var(--serif);font-size:22px;font-weight:400;margin-bottom:4px}
      .home-seo-agent-info span{display:block;font-size:12px;color:var(--muted);line-height:1.5}
      .home-story-areas{display:flex;flex-wrap:wrap;gap:8px 17px;margin-top:25px}
      .home-story-areas a{font-size:12px;color:#fff;text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(255,255,255,.45)}
      @media(max-width:800px){.home-story{padding:54px 0 38px}.home-seo-team{padding-top:38px;padding-bottom:32px}.home-listing-map{margin-top:38px}.home-rural-grid.home-rural-balanced{grid-template-columns:1fr}.home-rural-balanced .home-rural-photo{min-height:320px;max-height:420px}.home-rural-balanced .home-rural-copy{padding:52px 28px 60px}.home-story-grid{grid-template-columns:1fr;gap:36px}.home-story{padding:58px 0}.home-seo-team-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:480px){.home-story-proof{gap:9px}.home-story-proof article{padding:17px;min-height:125px}.home-seo-team-grid{gap:12px}.home-seo-agent-info{padding:14px}.home-seo-agent-info strong{font-size:19px}}
    `}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(businessSchema).replace(/</g,'\\u003c')}} />
    <section className="home-hero">
      <Image src={heroImage} alt="Kansas countryside and open fields" fill priority sizes="100vw" className="home-hero-image" />
      <div className="home-hero-overlay" />
      <div className="container home-hero-inner">
        <h1><span className="hero-heading-kicker">{headlineKicker}{headlineParts.length||settings.homepageHeadline.includes(",")?",":""}</span><span className="hero-heading-main">{headlineMain}</span></h1>
        <p className="hero-copy">{settings.heroDescription}</p>
        <HomeLeadButtons />
        <HomeSearch items={activeListings} />
      </div>
    </section>

    <section className="section container">
      <div className="section-head"><div><h2>Homes and properties in the area.</h2></div><Link href="/listings" className="text-link">Browse available homes and land</Link></div>
      <div className="featured-grid home-featured-grid">{listings.map(p=><ListingCard key={p.ListingId} p={p}/>)}</div><div className="home-all-listings-link"><Link href="/listings" className="button button-dark">See all listings</Link></div>
      {activeListings.length>0&&<div className="home-listing-map"><ListingMap listings={activeListings} searchAreaNavigate/></div>}
    </section>

    <section className="home-story">
      <div className="container home-story-grid">
        <div className="home-story-copy">
          <p className="eyebrow">A FAMILY BROKERAGE, ROOTED HERE</p>
          <h2>Real estate is personal.<br /><em>So is the way we do business.</em></h2>
          <p>We’re St. Mary’s Real Estate, a second-generation, family-owned brokerage serving St. Marys and communities across Northeast Kansas. Our first broker, Kevin Kirby, started the business more than 20 years ago with a straightforward belief: real estate decisions deserve honest advice from people who know the area.</p>
          <p>Today, the next generation carries that approach forward. We help buyers and sellers with homes, land, acreage, rural properties, and more, offering practical local guidance from the first conversation through closing.</p>
          <div className="home-story-areas" aria-label="Communities served">
            {serviceAreas.map(area=><Link href={"/communities/"+area.slug} key={area.slug}>{area.name}, KS</Link>)}
          </div>
          <Link href="/about" className="button button-light">More about our company</Link>
        </div>
        <div className="home-story-proof" aria-label="St. Mary’s Real Estate experience and reputation">
          <article><strong>20+ years</strong><span>Family-owned and serving Northeast Kansas</span></article>
          <article><strong>400+</strong><span>Verified real estate closings</span></article>
          <article><strong className="proof-rating">5.0 <span className="proof-stars" aria-label="5 out of 5 stars">★★★★★</span></strong><span>Rated on Google</span></article>
          <article><strong>Nearly $70M</strong><span>Total sales volume</span></article>
        </div>
      </div>
    </section>

    <section className="section container home-seo-team">
      <div className="section-head"><div><p className="eyebrow">THE PEOPLE BEHIND SMRE</p><h2>A local team you can get to know.</h2></div><Link href="/agents" className="text-link">Meet the full team</Link></div>
      <div className="home-seo-team-grid">
        {visibleAgents.map(agent=><Link className="home-seo-agent" href={`/agents/${agent.slug}`} key={agent.slug}>
          <div className="home-seo-agent-photo"><Image src={agent.photo} alt={`${agent.name}, ${agent.role} at St. Mary’s Real Estate`} width={600} height={675} sizes="(max-width: 480px) 46vw, (max-width: 800px) 46vw, 25vw" /></div>
          <div className="home-seo-agent-info"><strong>{agent.name}</strong><span>{agent.role}</span><span>{agent.market}</span></div>
        </Link>)}
      </div>
    </section>

    <section className="section container cta-grid home-cta-compact">
      <Link href="/valuation" className="cta-card"><span className="eyebrow">SELLING</span><h3>What is your home worth in today’s market?</h3><span className="text-link">Request a home value</span></Link>
      <Link href="/contact" className="cta-card"><span className="eyebrow">BUYING OR SELLING</span><h3>Have a property, a question, or a plan?</h3><span className="text-link">Talk with SMRE</span></Link>
    </section>

    <ReviewsCarousel />
    <div className="container home-mls-disclosure"><MLSDisclosure /></div>
  </>;
}
