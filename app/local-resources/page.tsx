import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Northeast Kansas Local Resources | St. Marys, Wamego & Nearby',
  description: 'Useful local links for residents and people moving to St. Marys, Wamego, Pottawatomie County, Manhattan and Topeka, including property information, schools, housing resources and community services.',
  alternates: { canonical: 'https://www.smre.info/local-resources' },
  openGraph: {
    type: 'website',
    title: 'Northeast Kansas Local Resources',
    description: 'A practical directory of local government, property, education, housing and community resources across Northeast Kansas.',
    url: 'https://www.smre.info/local-resources',
    images: [{ url: '/images/local-resources-kansas.jpg', width: 1600, height: 900, alt: 'Kansas countryside and open fields' }]
  }
};

const groups = [
  {
    title: 'St. Marys & Pottawatomie County',
    intro: 'Local government, property information and services for St. Marys and the surrounding county.',
    links: [
      ['City of St. Marys', 'https://www.smks.info/', 'City information, departments and local services.'],
      ['Pottawatomie County', 'https://www.pottcounty.org/', 'County offices, services, public notices and resident information.'],
      ['County GIS & property maps', 'https://www.pottcounty.org/153/Geographic-Information-Systems-GIS', 'Mapping information to help research parcels and property locations.'],
      ['Planning & Zoning', 'https://www.pottcounty.org/161/Planning-Zoning-Office', 'Contact the County about zoning, land use, permits and development questions.'],
      ['St. Marys Area Chamber of Commerce', 'https://www.stmaryschamber.org/', 'Local businesses, community information and chamber resources.'],
      ['MJ’s Coffee House', 'https://www.mjscoffeehouse.com/', 'Coffee, espresso and a local gathering place in downtown St. Marys.'],
      ['785 Plumbing', 'https://785plumbing.com/', 'Plumbing services for area homes and properties.'],
      ['Fullerton Automotive', 'https://www.google.com/maps/search/?api=1&query=Fullerton+Automotive+St+Marys+KS', 'Automotive repair in St. Marys.'],
      ['Wichman Automotive', 'https://www.google.com/maps/search/?api=1&query=Wichman+Automotive+St+Marys+KS', 'Automotive service in St. Marys.'],
      ['Gray’s Auto Repair', 'https://www.google.com/maps/search/?api=1&query=Grays+Auto+Repair+St+Marys+KS', 'Automotive repair in St. Marys.'],
      ['Kaw Valley USD 321', 'https://www.kawvalley.k12.ks.us/', 'District information, schools and enrollment resources.'],
      ['Pottawatomie Wabaunsee Regional Library', 'https://pwrlibrary.org/', 'Library locations, programs and public resources.']
    ]
  },
  {
    title: 'Wamego',
    intro: 'City services and community information for people living in or considering Wamego.',
    links: [
      ['City of Wamego', 'https://www.wamego.org/', 'City departments, services and community information.'],
      ['Wamego Chamber & Community Resources', 'https://www.wamego.org/chamber/community-resources', 'Local organizations and community contacts.'],
      ['Visit Wamego', 'https://www.visitwamego.com/', 'Local attractions, restaurants, events and things to do.'],
      ['Moving to Wamego', 'https://www.wamego.org/moving-to-wamego', 'Information for people relocating to the area.'],
      ['Wamego Parks & Recreation', 'https://www.wamego.org/parks', 'Parks, recreation and community facilities.'],
      ['Wamego Public Library', 'https://wamego.lib.nckls.org/local-resources/', 'Library services and local resource links.']
    ]
  },
  {
    title: 'Manhattan & Riley County',
    intro: 'Government, education and regional resources in the Manhattan area.',
    links: [
      ['City of Manhattan', 'https://www.cityofmhk.com/', 'City services, departments and resident information.'],
      ['Riley County', 'https://www.rileycountyks.gov/', 'County services, public information and departments.'],
      ['Manhattan Area Chamber of Commerce', 'https://www.manhattan.org/', 'Business and community information.'],
      ['Riley County Parks & Recreation', 'https://www.rileycountyks.gov/1630/Parks-Recreation-Facilities', 'County parks and recreation facilities.'],
      ['Kansas State University', 'https://www.k-state.edu/', 'University information, programs and campus resources.']
    ]
  },
  {
    title: 'Topeka & Shawnee County',
    intro: 'City and county services, education and community information for the Topeka area.',
    links: [
      ['City of Topeka', 'https://www.topeka.org/', 'City services, departments and resident information.'],
      ['Shawnee County', 'https://www.snco.gov/', 'County government, services and public information.'],
      ['Greater Topeka Partnership', 'https://www.topekapartnership.com/', 'Regional business, workforce and economic development information.'],
      ['Topeka & Shawnee County Public Library', 'https://tscpl.org/', 'Library programs, services and community resources.'],
      ['Washburn University', 'https://www.washburn.edu/', 'University information and campus resources.']
    ]
  },
  {
    title: 'Kansas Housing & Statewide Resources',
    intro: 'Statewide information that may help with homeownership, housing programs and living in Kansas.',
    links: [
      ['My Home Kansas', 'https://www.myhomekansas.com/', 'A Kansas-focused directory for discovering communities, local businesses, places and things to do.'],
      ['Kansas Housing Resources Corporation', 'https://kshousingcorp.org/', 'State housing programs, homeownership information and assistance resources.'],
      ['Kansas Department of Commerce: Housing', 'https://www.kansascommerce.gov/housing/', 'State housing initiatives and community development information.'],
      ['Kansas Department of Revenue', 'https://www.ksrevenue.gov/', 'State tax information and services.'],
      ['Kansas Department of Wildlife & Parks', 'https://ksoutdoors.com/', 'State parks, outdoor recreation, licenses and wildlife information.'],
      ['Kansas 211', 'https://211kansas.org/', 'Information and referrals for health, human and community services.']
    ]
  }
];

function ResourceGroup({ group }: { group: typeof groups[number] }) {
  return <section className="resource-group" aria-labelledby={group.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}>
    <div className="resource-group-heading">
      <h2 id={group.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}>{group.title}</h2>
      <p>{group.intro}</p>
    </div>
    <div className="resource-link-grid">
      {group.links.map(([label, url, description]) => <a className="resource-link-card" href={url} target="_blank" rel="noopener noreferrer" key={url}>
        <span className="resource-link-title">{label}<span aria-hidden="true"> ↗</span></span>
        <span className="resource-link-description">{description}</span>
      </a>)}
    </div>
  </section>;
}

export default function LocalResourcesPage() {
  return <div className="local-resources-page">
    <style>{`
      .local-resources-page{padding-bottom:86px}
      .resources-hero{position:relative;min-height:390px;display:flex;align-items:end;overflow:hidden;background:var(--navy);color:#fff}
      .resources-hero-art{position:absolute;inset:0;background:linear-gradient(120deg,rgba(12,25,55,.94),rgba(12,25,55,.48)),url('https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2000&q=85') center 55%/cover;z-index:0}
      .resources-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,14,48,.82),rgba(9,14,48,.3)),linear-gradient(0deg,rgba(9,14,48,.35),transparent 65%);z-index:1}
      .resources-hero-content{position:relative;z-index:2;padding:72px 0 62px;max-width:820px}
      .resources-hero .eyebrow{color:#fff;opacity:.8}
      .resources-hero h1{font-family:var(--serif);font-weight:400;font-size:clamp(44px,6vw,72px);line-height:1.02;letter-spacing:-.04em;margin:0 0 18px}
      .resources-hero p:not(.eyebrow){font-size:17px;line-height:1.7;color:rgba(255,255,255,.9);max-width:690px;margin:0}
      .resources-intro{padding:34px 0 16px;max-width:850px}
      .resource-jump{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0 6px}.resource-jump a{font-size:12px;font-weight:650;color:var(--navy);text-decoration:none;border:1px solid var(--line);padding:9px 13px;border-radius:30px}.resource-jump a:hover{background:var(--wash)}
      .resource-note{font-size:12px;line-height:1.6;color:var(--muted);margin-top:20px}
      .resources-intro p{font-size:15px;line-height:1.75;color:var(--muted)}
      .resource-group{padding:38px 0 42px;border-bottom:1px solid var(--line)}
      .resource-group-heading{display:grid;grid-template-columns:.8fr 1.2fr;gap:36px;align-items:end;margin-bottom:22px}
      .resource-group h2{font-family:var(--serif);font-weight:400;font-size:clamp(28px,3vw,38px);line-height:1.1;letter-spacing:-.03em;margin:0}
      .resource-group-heading p{margin:0;color:var(--muted);font-size:14px;line-height:1.65;max-width:620px}
      .resource-link-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .resource-link-card{display:flex;flex-direction:column;gap:8px;padding:18px 19px;border:1px solid var(--line);color:var(--navy);text-decoration:none;min-height:116px;transition:background .16s,border-color .16s}
      .resource-link-card:hover{background:var(--wash);border-color:var(--navy)}
      .resource-link-title{font-size:14px;font-weight:700;line-height:1.35}
      .resource-link-title span{font-size:11px;white-space:nowrap}
      .resource-link-description{font-size:12px;line-height:1.55;color:var(--muted)}
      .resources-site-guides{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:30px 32px;background:var(--wash);border:1px solid var(--line);margin-top:48px}
      .resources-site-guides h2{font-family:var(--serif);font-size:30px;font-weight:400;line-height:1.15;margin:0 0 7px}
      .resources-site-guides p{margin:0;color:var(--muted);font-size:13px;max-width:650px}
      .resources-site-guides .button{flex:0 0 auto}
      @media(max-width:850px){.resource-link-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.resource-group-heading{grid-template-columns:1fr;gap:9px}}
      @media(max-width:560px){.resources-hero{min-height:360px}.resources-hero-content{padding:56px 0 46px}.resource-link-grid{grid-template-columns:1fr}.resource-link-card{min-height:0}.resource-group{padding:30px 0}.resources-site-guides{align-items:flex-start;flex-direction:column;padding:24px}.resources-site-guides .button{width:100%}}
    `}</style>
    <section className="resources-hero">
      <div className="resources-hero-art" aria-hidden="true" />
      <div className="container resources-hero-content">
        <p className="eyebrow">A LOCAL REFERENCE</p>
        <h1>Northeast Kansas Local Resources</h1>
        <p>Useful links for living in, moving to, or researching communities across St. Marys, Pottawatomie County, Wamego, Manhattan and Topeka.</p>
      </div>
    </section>
    <div className="container">
      <div className="resources-intro">
        <p>This page brings together local government, property information, schools, community organizations and Kansas housing resources in one place. It is a starting point for your research, not a substitute for confirming current requirements with the responsible agency. If you are considering a property, verify zoning, utilities, taxes, permits and other property-specific details directly with the appropriate office.</p>
      </div>
      <nav className="resource-jump" aria-label="Jump to resource category">{groups.map((group,index)=><a key={group.title} href={`#resource-${index}`}>{group.title}</a>)}</nav>
      {groups.map((group,index) => <div id={`resource-${index}`} key={group.title}><ResourceGroup group={group} /></div>)}
      <p className="resource-note">These links are provided as a starting point for local research, not as endorsements or recommendations. Business services, hours and contact details can change, so confirm information directly with each provider.</p>
      <section className="resources-site-guides">
        <div><h2>Looking into a move or a property?</h2><p>Our local real estate guides cover buying a first home, evaluating land, rural water, county zoning and other questions that can come up across Northeast Kansas.</p></div>
        <Link className="button button-dark" href="/guides">Browse Real Estate Guides</Link>
      </section>
      <p className="resources-back-link" style={{marginTop:28,fontSize:13,color:'var(--muted)'}}>Explore the areas we serve: <Link href="/communities/st-marys">St. Marys</Link>, <Link href="/communities/wamego">Wamego</Link>, <Link href="/communities/manhattan">Manhattan</Link>, <Link href="/communities/topeka">Topeka</Link>, <Link href="/communities/rossville">Rossville</Link> and <Link href="/communities/silver-lake">Silver Lake</Link>.</p>
    </div>
  </div>;
}
