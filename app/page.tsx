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
const fallbackAreaImage = '/images/ChatGPT Image Sep 30, 2026, 02_28_25 PM.png';
const serviceAreas = [{name:'St. Marys',slug:'st-marys'},{name:'Wamego',slug:'wamego'},{name:'Rossville',slug:'rossville'},{name:'Silver Lake',slug:'silver-lake'},{name:'Manhattan',slug:'manhattan'},{name:'Topeka',slug:'topeka'}];

export const revalidate = 60;

export default async function Home(){
  const activeListings=sortListingsByPriority((await getListings()).filter(p=>p.StandardStatus==='Active')).map((p) => ({ ...p, Media: p.Media.slice(0, 1) }));
  const {settings,agents}=await getAdminData();
  const listings=activeListings.slice(0,settings.featuredCount||6);
  const headlineParts=settings.homepageHeadline.split(',');
  const headlineKicker=headlineParts.shift()?.trim()||'REAL ESTATE,';
  const headlineMain=headlineParts.join(',').trim()||'Close to Home.';
  const areaImage=settings.localImage||fallbackAreaImage;
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
      .home-seo-intro{padding-top:72px;padding-bottom:76px}
      .home-seo-intro .seo-copy{max-width:850px;color:var(--muted);font-size:16px;line-height:1.8}
      .home-seo-intro h2,.home-seo-team h2{font-family:var(--serif);font-size:clamp(32px,4vw,44px);font-weight:400;line-height:1.12;letter-spacing:-.035em;margin:0 0 20px}
      .home-seo-intro .seo-areas{display:flex;flex-wrap:wrap;gap:9px 18px;margin:24px 0 0;padding:0;list-style:none}
      .home-seo-intro .seo-areas a{color:var(--navy);font-size:13px;font-weight:700;text-decoration:underline;text-underline-offset:4px}
      .home-seo-team{padding-top:0}
      .home-seo-team-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
      .home-seo-agent{border:1px solid var(--line);padding:22px;color:var(--navy);text-decoration:none;display:flex;flex-direction:column;gap:8px}
      .home-seo-agent strong{font-family:var(--serif);font-size:22px;font-weight:400}
      .home-seo-agent span{font-size:12px;color:var(--muted)}
      .home-seo-agent:hover{background:var(--wash)}
      @media(max-width:800px){.home-listing-map{margin-top:38px}.home-rural-grid.home-rural-balanced{grid-template-columns:1fr}.home-rural-balanced .home-rural-photo{min-height:320px;max-height:420px}.home-rural-balanced .home-rural-copy{padding:52px 28px 60px}.home-seo-team-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:480px){.home-seo-team-grid{grid-template-columns:1fr}}
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

    <section className="home-rural-strip">
      <div className="home-rural-grid home-rural-balanced">
        <div className="home-rural-photo"><img src={areaImage} alt="Kansas farm at sunset with a barn, fields and a country road" loading="lazy" /></div>
        <div className="home-rural-copy"><h2>LOCAL KNOWLEDGE. PERSONAL SERVICE.</h2><p>Our local agents work with buyers and sellers throughout Northeast Kansas, bringing practical market knowledge, straightforward advice, and a personal approach to every transaction. Get to know our team, how we work, and the communities we serve.</p><Link href="/about" className="button button-light">About SMRE</Link></div>
      </div>
    </section>

    <section className="section container home-seo-intro">
      <p className="eyebrow">ST. MARYS, KANSAS REAL ESTATE</p>
      <h2>Real Estate, Close to Home in Northeast Kansas</h2>
      <div className="seo-copy">
        <p>St. Mary’s Real Estate is a family-owned brokerage based in St. Marys, Kansas. Our agents work with buyers and sellers across the Topeka-to-Manhattan area, combining local knowledge with straightforward advice and personal attention. We help people navigate the details of buying or selling a home, evaluating land, and making decisions about rural and investment properties.</p>
        <p>Our team includes principal broker Joseph Kirby, agent Thomas Kirby, associate broker James Frazier, and agent Michael Kirby. Together, they work with a range of property needs, including residential homes, land and acreage, rural properties, new construction, commercial real estate, and investments. You can learn more about each agent, their experience, and the areas they serve on our team profiles.</p>
        <p>Whether you are moving to the area, selling a longtime home, purchasing your first property, or considering land outside town, we aim to make the process clear and manageable. We stay involved, answer questions, and help clients understand the local factors that can affect a real estate decision.</p>
      </div>
      <ul className="seo-areas" aria-label="Communities served">
        {serviceAreas.map(area=><li key={area.slug}><Link href={"/communities/"+area.slug}>{area.name}, KS</Link></li>)}
      </ul>
    </section>

    <section className="section container home-seo-team">
      <div className="section-head"><div><p className="eyebrow">MEET THE AGENTS</p><h2>Local agents. Practical guidance.</h2></div><Link href="/agents" className="text-link">Meet the SMRE team</Link></div>
      <div className="home-seo-team-grid">
        {visibleAgents.map(agent=><Link className="home-seo-agent" href={`/agents/${agent.slug}`} key={agent.slug}><strong>{agent.name}</strong><span>{agent.role}</span><span>{agent.market}</span></Link>)}
      </div>
    </section>

    <section className="section container cta-grid">
      <Link href="/valuation" className="cta-card"><span className="eyebrow">SELLING</span><h3>What is your home worth in today’s market?</h3><span className="text-link">Request a home value</span></Link>
      <Link href="/contact" className="cta-card"><span className="eyebrow">BUYING OR SELLING</span><h3>Have a property, a question, or a plan?</h3><span className="text-link">Talk with SMRE</span></Link>
    </section>

    <ReviewsCarousel />
    <div className="container home-mls-disclosure"><MLSDisclosure /></div>
  </>;
}
