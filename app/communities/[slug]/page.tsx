import Link from 'next/link';
import { notFound } from 'next/navigation';

type Community = {
  name:string;
  slug:string;
  intro:string;
  localFocus:string;
  propertyFocus:string;
};

const communities:Community[] = [
  {name:'St. Marys',slug:'st-marys',intro:'St. Marys is home to St. Mary’s Real Estate. Our brokerage is based here, and our agents work with buyers and sellers considering homes, land, and rural properties in the community and nearby areas.',localFocus:'For buyers moving to St. Marys, it helps to look beyond the home itself. Property location, access, utilities, condition, and proximity to the services you use every day can all shape whether a property is the right fit.',propertyFocus:'Our team works with residential properties, rural homes, land and acreage, investment opportunities, and new construction in and around St. Marys.'},
  {name:'Wamego',slug:'wamego',intro:'St. Mary’s Real Estate serves buyers and sellers in Wamego and the surrounding communities. We help clients compare homes, evaluate property details, and understand the practical considerations involved in a purchase or sale.',localFocus:'When evaluating a Wamego property, consider its location, condition, utility arrangements, lot characteristics, and how it fits your plans. Buyers comparing in-town homes with properties outside town may have different due-diligence needs.',propertyFocus:'We assist with residential real estate as well as rural homes, land, acreage, and investment properties in the Wamego area.'},
  {name:'Manhattan',slug:'manhattan',intro:'St. Mary’s Real Estate works with clients looking to buy or sell property in Manhattan and the communities between Manhattan and St. Marys. Our service area follows the Topeka-to-Manhattan corridor, with a focus on practical local guidance.',localFocus:'Manhattan buyers and sellers may be weighing different property types, locations, and timelines. A clear understanding of condition, pricing, financing, and the details of each property helps make comparisons more useful.',propertyFocus:'Our agents work with residential homes, land and acreage, new construction, and investment opportunities.'},
  {name:'Topeka',slug:'topeka',intro:'St. Mary’s Real Estate serves buyers and sellers in Topeka and nearby Northeast Kansas communities. We provide hands-on help with residential property decisions and work with clients considering a range of property types.',localFocus:'When buying or selling in the Topeka area, property-specific factors matter. Location, condition, improvements, lot size, and comparable sales all help inform a sound decision.',propertyFocus:'Our brokerage handles residential real estate, land and acreage, rural properties, commercial property, and investment opportunities.'},
  {name:'Rossville',slug:'rossville',intro:'St. Mary’s Real Estate works with buyers and sellers in Rossville and the surrounding area. As a St. Marys-based brokerage, we serve smaller communities throughout the region as well as the larger Topeka and Manhattan markets.',localFocus:'For properties in and around Rossville, buyers may want to pay particular attention to lot characteristics, outbuildings, utility service, access, and the condition of major systems. The right questions depend on the individual property.',propertyFocus:'We help clients with homes, rural properties, land and acreage, and property sales in the Rossville area.'},
  {name:'Silver Lake',slug:'silver-lake',intro:'St. Mary’s Real Estate serves Silver Lake and surrounding communities in Northeast Kansas. Our agents help clients navigate the purchase and sale of homes and other property, with local knowledge and straightforward communication.',localFocus:'A useful property comparison considers more than the asking price. Location, property condition, lot size, improvements, and recent comparable sales can all influence value and suitability.',propertyFocus:'Our team works with residential properties, rural homes, land and acreage, and investment opportunities.'}
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
  return <section className="section container">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}} />
    <div className="page-intro">
      <p className="eyebrow">NORTHEAST KANSAS REAL ESTATE</p>
      <h1>{community.name}, Kansas Real Estate</h1>
      <p>{community.intro}</p>
    </div>
    <div className="about-copy">
      <h2>Local real estate guidance in {community.name}</h2>
      <p>{community.localFocus}</p>
      <h2>Homes, land and property</h2>
      <p>{community.propertyFocus}</p>
      <p>St. Mary’s Real Estate is a family-owned brokerage based at 512 W Bertrand Ave in St. Marys, Kansas. Our agents serve clients across the Topeka-to-Manhattan area and can help you understand the next steps whether you are buying, selling, or exploring your options.</p>
    </div>
    <div className="about-local-points">
      <div className="about-local-point"><p className="eyebrow">SEARCH</p><p>Browse current homes and properties in our service area.</p><Link className="text-link" href="/listings">View available listings</Link></div>
      <div className="about-local-point"><p className="eyebrow">SELL</p><p>Get a local perspective on your property's value and the selling process.</p><Link className="text-link" href="/valuation">Request a home value</Link></div>
      <div className="about-local-point"><p className="eyebrow">CONNECT</p><p>Talk with a member of the St. Mary’s Real Estate team.</p><Link className="text-link" href="/contact">Contact SMRE</Link></div>
    </div>
    <div className="section-head compact"><div><p className="eyebrow">MORE COMMUNITIES</p><h2>Explore nearby areas</h2></div></div>
    <div className="tag-list">{communities.filter(item=>item.slug!==community.slug).map(item=><Link key={item.slug} href={`/communities/${item.slug}`}>{item.name}, KS</Link>)}</div>
    <p className="lead" style={{marginTop:40}}>Learn more about <Link href="/about">St. Mary’s Real Estate</Link> and the agents who serve Northeast Kansas.</p>
  </section>;
}
