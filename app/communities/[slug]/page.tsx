import Link from 'next/link';
import { notFound } from 'next/navigation';

type Community = {
  name:string;
  slug:string;
  intro:string;
  localFocus:string;
  smreFit:string;
};

const communities:Community[] = [
  {
    name:'St. Marys',slug:'st-marys',
    intro:'St. Marys is home to St. Mary’s Real Estate. We know this community not just as a place where we do business, but as the place our family brokerage has called home for more than 20 years. Whether you are looking for a home in town, a place with room to spread out, or land for a future project, we can help you understand the options.',
    localFocus:'Real estate in and around St. Marys can look different from one property to the next. In-town homes, rural residences, and acreage each bring their own questions about location, utilities, access, property condition, and future plans. Taking time to understand those details is an important part of making a confident decision.',
    smreFit:'Our roots are here, and our work reaches throughout the surrounding area. As a second-generation, family-owned brokerage, we bring local perspective, straightforward communication, and hands-on guidance to buyers and sellers. We work with residential homes, land, acreage, rural properties, new construction, and investment opportunities.'
  },
  {
    name:'Wamego',slug:'wamego',
    intro:'Wamego offers buyers and sellers a distinct small-community market within the greater Topeka-to-Manhattan area. St. Mary’s Real Estate works with clients considering homes and property in Wamego, whether they are moving into the area, making a change locally, or weighing a property outside town.',
    localFocus:'When comparing Wamego properties, think about more than the list price. The home’s condition, lot, access, utility arrangements, and location in relation to your day-to-day needs all matter. Buyers looking at homes in town may have different questions than those considering rural homes or acreage nearby.',
    smreFit:'Our St. Marys office is close to Wamego, and our agents regularly work across this part of Northeast Kansas. We can help you evaluate the details, understand the local market context, and navigate the steps involved in buying or selling. Our experience includes homes, land, acreage, rural properties, and investment real estate.'
  },
  {
    name:'Manhattan',slug:'manhattan',
    intro:'Manhattan is an important part of the Northeast Kansas real estate market, and St. Mary’s Real Estate serves clients looking to buy or sell here and in the communities between Manhattan and St. Marys. We help people consider the right property, location, and next step for their circumstances.',
    localFocus:'Manhattan offers a range of property types and locations, so a useful search starts with your priorities. Consider commute and access, property condition, neighborhood setting, lot characteristics, and how the home or property fits your plans. Sellers also benefit from understanding comparable properties and how buyers are likely to view their home.',
    smreFit:'Our brokerage serves the broader Topeka-to-Manhattan corridor, bringing a practical perspective to residential sales as well as land, acreage, rural properties, and new construction. You will work with a local agent who takes the time to understand your goals and communicate clearly throughout the process.'
  },
  {
    name:'Topeka',slug:'topeka',
    intro:'St. Mary’s Real Estate serves buyers and sellers in Topeka and the surrounding Northeast Kansas communities. Whether you are searching for a home, preparing to sell, or exploring land and other property, our team can help you make sense of the options and the details that matter.',
    localFocus:'Topeka has a broad mix of homes and property, and each decision calls for its own set of questions. Buyers should consider location, condition, improvements, lot size, and the costs that may come with a property. Sellers need a clear view of comparable sales, current competition, and how to position their property in the market.',
    smreFit:'We combine the personal service of a family-owned brokerage with experience across a range of property types. Our agents help with residential real estate, land and acreage, rural properties, commercial opportunities, and investment property, with straightforward advice from the first conversation through closing.'
  },
  {
    name:'Rossville',slug:'rossville',
    intro:'Rossville is one of the smaller communities served by St. Mary’s Real Estate. Our St. Marys-based team works with buyers and sellers throughout the surrounding area, including people looking for a home in town or more space outside of it.',
    localFocus:'In and around Rossville, property details can make a meaningful difference. Depending on the property, it may be important to look closely at lot size, outbuildings, access, utility service, and the condition of major systems. The right due diligence starts with understanding how you plan to use the property.',
    smreFit:'We understand the practical questions that come with buying and selling in smaller communities and rural areas. Our team works with homes, acreage, land, and rural properties, and we aim to make the process clear, responsive, and grounded in the details of the property rather than a one-size-fits-all sales pitch.'
  },
  {
    name:'Silver Lake',slug:'silver-lake',
    intro:'St. Mary’s Real Estate serves Silver Lake and nearby communities as part of our broader Northeast Kansas service area. Whether you are buying your next home, selling a property, or looking for more room, our agents can help you evaluate your options and plan the next steps.',
    localFocus:'A good property decision involves more than comparing asking prices. Location, condition, improvements, lot size, access, and recent comparable sales all help shape a clearer picture of a property’s value and suitability. For rural properties, utility arrangements and other site-specific details may also deserve attention.',
    smreFit:'Our family-owned brokerage is based in nearby St. Marys, and our agents work with buyers and sellers throughout the region. We offer practical guidance across residential homes, rural properties, land, acreage, and investment opportunities, with direct communication and attention to the details that can affect a transaction.'
  }
];

export function generateStaticParams(){return communities.map(({slug})=>({slug}));}
export const dynamicParams=false;

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const community=communities.find(item=>item.slug===slug);
  if(!community)return {};
  return {
    title:`${community.name}, KS Real Estate | Homes & Land`,
    description:`Buy or sell a home, rural property, land or acreage in ${community.name}, Kansas with St. Mary’s Real Estate. Local service from our St. Marys-based team.`,
    alternates:{canonical:`/communities/${community.slug}`}
  };
}

export default async function CommunityPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const community=communities.find(item=>item.slug===slug);
  if(!community)notFound();
  const schema={
    '@context':'https://schema.org',
    '@type':'RealEstateAgent',
    name:'St. Mary’s Real Estate',
    url:'https://www.smre.info',
    areaServed:{'@type':'City',name:community.name,containedInPlace:{'@type':'State',name:'Kansas'}}
  };
  const listingsHref=`/listings?city=${encodeURIComponent(community.name)}`;
  return <section className="section container community-page">
    <style>{`
      .community-page{padding-top:76px;padding-bottom:82px}
      .community-page .page-intro{max-width:900px;margin-bottom:44px}
      .community-page .page-intro p:not(.eyebrow){font-size:17px;line-height:1.75;max-width:800px}
      .community-reading{display:grid;grid-template-columns:1fr 1fr;gap:54px;max-width:1060px;margin:0 auto 48px}
      .community-reading section{min-width:0}
      .community-reading h2,.community-listings-cta h2{font-family:var(--serif);font-size:clamp(28px,3vw,36px);font-weight:400;line-height:1.12;letter-spacing:-.03em;margin:0 0 14px}
      .community-reading .eyebrow{margin-bottom:12px}
      .community-reading p:not(.eyebrow){font-size:15px;line-height:1.8;color:var(--muted);margin:0}
      .community-listings-cta{display:flex;align-items:center;justify-content:space-between;gap:30px;padding:30px 34px;background:var(--wash);border:1px solid var(--line);margin:0 0 34px}
      .community-listings-cta .eyebrow{margin-bottom:9px}
      .community-listings-cta h2{margin-bottom:7px}
      .community-listings-cta p:not(.eyebrow){margin:0;color:var(--muted);font-size:14px}
      .community-listings-cta .button{flex:0 0 auto;min-height:50px;padding:14px 22px}
      .community-next-steps{display:grid;grid-template-columns:1fr 1fr;gap:30px;padding:0 0 36px;border-bottom:1px solid var(--line)}
      .community-next-steps .about-local-point{padding:14px 0}
      .community-next-steps .about-local-point p:not(.eyebrow){color:var(--muted);font-size:14px;line-height:1.65;margin:0 0 10px}
      .community-more{padding-top:38px}
      .community-more .section-head{margin-bottom:16px}
      .community-more .section-head h2{font-family:var(--serif);font-weight:400;font-size:32px;margin:0}
      .community-more .lead{font-size:14px;margin-top:28px}
      @media(max-width:700px){
        .community-page{padding-top:48px;padding-bottom:56px}
        .community-page .page-intro{margin-bottom:34px}
        .community-reading{grid-template-columns:1fr;gap:28px;margin-bottom:34px}
        .community-listings-cta{align-items:flex-start;flex-direction:column;gap:20px;padding:24px}
        .community-listings-cta .button{width:100%}
        .community-next-steps{gap:20px}
      }
      @media(max-width:480px){.community-next-steps{grid-template-columns:1fr;gap:12px}.community-next-steps .about-local-point{padding:10px 0}}
    `}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}} />
    <div className="page-intro">
      <p className="eyebrow">NORTHEAST KANSAS REAL ESTATE</p>
      <h1>${community.name}, Kansas Real Estate</h1>
      <p>${community.intro}</p>
    </div>
    <div className="community-reading">
      <section>
        <p className="eyebrow">GET TO KNOW THE AREA</p>
        <h2>Buying or selling in ${community.name}</h2>
        <p>${community.localFocus}</p>
      </section>
      <section>
        <p className="eyebrow">WHY WORK WITH SMRE</p>
        <h2>Local guidance, personal service</h2>
        <p>${community.smreFit}</p>
      </section>
    </div>
    <div className="community-listings-cta">
      <div>
        <p className="eyebrow">EXPLORE AVAILABLE PROPERTY</p>
        <h2>Looking in ${community.name}?</h2>
        <p>See current homes and properties listed in ${community.name}, Kansas.</p>
      </div>
      <Link className="button button-dark" href={listingsHref}>See Listings in ${community.name}</Link>
    </div>
    <div className="community-next-steps">
      <div className="about-local-point"><p className="eyebrow">SELLING</p><p>Get a local perspective on your property’s value and the selling process.</p><Link className="text-link" href="/valuation">Request a home value</Link></div>
      <div className="about-local-point"><p className="eyebrow">CONNECT</p><p>Talk with a member of the St. Mary’s Real Estate team about your plans.</p><Link className="text-link" href="/contact">Contact SMRE</Link></div>
    </div>
    <div className="community-more">
      <div className="section-head compact"><div><p className="eyebrow">MORE COMMUNITIES</p><h2>Explore nearby areas</h2></div></div>
      <div className="tag-list">{communities.filter(item=>item.slug!==community.slug).map(item=><Link key={item.slug} href={`/communities/${item.slug}`}>{item.name}, KS</Link>)}</div>
      <p className="lead">Learn more about <Link href="/about">St. Mary’s Real Estate</Link> and the agents who serve Northeast Kansas.</p>
    </div>
  </section>;
}
