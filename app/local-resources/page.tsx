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

function ResourceGroup({ group, index }: { group: typeof groups[number]; index: number }) {
  return (
    <section className="resource-group" id={`resource-${index}`} aria-labelledby={`resource-heading-${index}`}>
      <div className="resource-group-heading">
        <span className="resource-region">0{index + 1}</span>
        <div>
          <h2 id={`resource-heading-${index}`}>{group.title}</h2>
          <p>{group.intro}</p>
        </div>
      </div>
      <div className="resource-link-list">
        {group.links.map(([label, url, description]) => (
          <a className="resource-link" href={url} target="_blank" rel="noopener noreferrer" key={url}>
            <span className="resource-link-copy">
              <span className="resource-link-title">{label}</span>
              <span className="resource-link-description">{description}</span>
            </span>
            <span className="resource-link-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function LocalResourcesPage() {
  return (
    <div className="local-resources-page">
      <style>{`
        .local-resources-page{background:#f7f5ef;color:var(--navy);padding-bottom:76px}
        .resources-hero{display:grid;grid-template-columns:1fr 1fr;min-height:370px;background:var(--navy);color:#fff}
        .resources-hero-content{width:min(620px,calc(100% - 56px));justify-self:end;align-self:center;padding:58px 58px 58px 0}
        .resources-hero .eyebrow{color:#fff;opacity:.72;margin-bottom:20px}
        .resources-hero h1{font-family:var(--serif);font-size:clamp(42px,5.2vw,66px);font-weight:400;line-height:1.02;letter-spacing:-.04em;margin:0 0 20px;max-width:560px}
        .resources-hero p:not(.eyebrow){font-size:16px;line-height:1.7;color:rgba(255,255,255,.88);max-width:540px;margin:0}
        .resources-hero-photo{min-height:370px;background:url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=90') center 48%/cover}
        .resources-main{max-width:1120px}
        .resources-intro{max-width:780px;padding:44px 0 25px}
        .resources-intro p{font-size:15px;line-height:1.75;color:#50536b;margin:0}
        .resource-nav-wrap{padding:18px 0 26px;border-bottom:1px solid rgba(15,20,71,.16)}
        .resource-nav-label{font-size:10px;letter-spacing:.17em;text-transform:uppercase;font-weight:700;color:#77798b;margin:0 0 12px}
        .resource-jump{display:flex;flex-wrap:wrap;gap:8px}
        .resource-jump a{font-size:12px;font-weight:700;color:var(--navy);text-decoration:none;padding:9px 13px;background:#fff;border:1px solid rgba(15,20,71,.13);border-radius:2px}
        .resource-jump a:hover{background:var(--navy);color:#fff}
        .resource-group{display:grid;grid-template-columns:.85fr 1.15fr;gap:54px;padding:42px 0;border-bottom:1px solid rgba(15,20,71,.16);scroll-margin-top:30px}
        .resource-group-heading{display:flex;align-items:flex-start;gap:18px}
        .resource-region{font-family:var(--serif);font-size:19px;color:#a08b61;padding-top:3px}
        .resource-group h2{font-family:var(--serif);font-weight:400;font-size:clamp(28px,3vw,36px);line-height:1.12;letter-spacing:-.025em;margin:0 0 12px}
        .resource-group-heading p{font-size:13px;line-height:1.7;color:#626478;margin:0;max-width:340px}
        .resource-link-list{display:grid;grid-template-columns:1fr 1fr;column-gap:28px}
        .resource-link{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 0;border-bottom:1px solid rgba(15,20,71,.12);text-decoration:none;color:var(--navy);min-width:0}
        .resource-link:nth-last-child(-n+2){border-bottom:0}
        .resource-link-copy{display:flex;flex-direction:column;gap:4px;min-width:0}
        .resource-link-title{font-size:13px;font-weight:700;line-height:1.35}
        .resource-link-description{font-size:11px;line-height:1.5;color:#686a7b}
        .resource-link-arrow{font-size:14px;color:#9b8559;flex:0 0 auto;transition:transform .15s}
        .resource-link:hover .resource-link-title{text-decoration:underline;text-underline-offset:3px}
        .resource-link:hover .resource-link-arrow{transform:translate(2px,-2px)}
        .resource-note{font-size:11px;line-height:1.65;color:#737486;margin:28px 0 0;max-width:850px}
        .resources-site-guides{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:30px 34px;background:#eae6da;margin-top:46px}
        .resources-site-guides h2{font-family:var(--serif);font-size:30px;font-weight:400;line-height:1.15;margin:0 0 8px}
        .resources-site-guides p{margin:0;color:#5c5e70;font-size:13px;line-height:1.6;max-width:650px}
        .resources-site-guides .button{flex:0 0 auto}
        .resources-back-link{margin-top:26px;font-size:12px;color:#66697c}
        .resources-back-link a{color:var(--navy);text-underline-offset:3px}
        @media(max-width:850px){.resources-hero-content{padding:46px 30px 46px 0}.resource-group{grid-template-columns:1fr;gap:18px}.resource-group-heading{max-width:650px}}
        @media(max-width:600px){.resources-hero{grid-template-columns:1fr}.resources-hero-content{width:calc(100% - 44px);justify-self:center;padding:48px 0 34px}.resources-hero-photo{min-height:210px;order:-1}.resources-intro{padding:30px 0 20px}.resource-jump{gap:7px}.resource-jump a{font-size:11px;padding:8px 10px}.resource-group{padding:30px 0;gap:12px}.resource-link-list{grid-template-columns:1fr}.resource-link:nth-last-child(-n+2){border-bottom:1px solid rgba(15,20,71,.12)}.resource-link:last-child{border-bottom:0}.resources-site-guides{align-items:flex-start;flex-direction:column;padding:24px}.resources-site-guides .button{width:100%}}
      `}</style>

      <section className="resources-hero">
        <div className="resources-hero-content">
          <p className="eyebrow">A LOCAL REFERENCE</p>
          <h1>Useful places and information across Northeast Kansas.</h1>
          <p>Local services, community organizations and public information for St. Marys, Wamego, Manhattan, Topeka and nearby areas.</p>
        </div>
        <div className="resources-hero-photo" role="img" aria-label="Open green Kansas countryside beneath a bright sky" />
      </section>

      <div className="container resources-main">
        <div className="resources-intro">
          <p>Whether you are new to the area or have lived here for years, this is a practical place to start when looking for local services, property information, schools and community resources. For property-specific questions, confirm zoning, utilities, taxes and permit requirements with the appropriate office.</p>
        </div>

        <nav className="resource-nav-wrap" aria-label="Resource areas">
          <p className="resource-nav-label">Browse by area</p>
          <div className="resource-jump">
            {groups.map((group, index) => <a key={group.title} href={`#resource-${index}`}>{group.title}</a>)}
          </div>
        </nav>

        {groups.map((group, index) => <ResourceGroup group={group} index={index} key={group.title} />)}

        <p className="resource-note">Links are provided as a starting point, not as endorsements or recommendations. Business services, hours and contact details can change, so confirm information directly with each provider.</p>

        <section className="resources-site-guides">
          <div>
            <h2>Looking into a move or a property?</h2>
            <p>Our local real estate guides cover buying, selling, land, rural water, county zoning and other questions that can come up across Northeast Kansas.</p>
          </div>
          <Link className="button button-dark" href="/guides">Browse Real Estate Guides</Link>
        </section>

        <p className="resources-back-link">Explore the areas we serve: <Link href="/communities/st-marys">St. Marys</Link>, <Link href="/communities/wamego">Wamego</Link>, <Link href="/communities/manhattan">Manhattan</Link>, <Link href="/communities/topeka">Topeka</Link>, <Link href="/communities/rossville">Rossville</Link> and <Link href="/communities/silver-lake">Silver Lake</Link>.</p>
      </div>
    </div>
  );
}
