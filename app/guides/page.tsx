import Link from 'next/link';
import { getAdminData } from '../lib/admin-store';

export const metadata={title:'Local Real Estate Guides',description:'Practical real estate guides for St. Marys, Wamego, Topeka, Manhattan and Northeast Kansas.'};

export default async function Guides(){const {guides}=await getAdminData();return <section className="section container guides-page">
  <div className="page-intro">
    <p className="eyebrow">LOCAL REAL ESTATE GUIDES</p>
    <h1>Real Estate Guides for Northeast Kansas</h1>
  </div>
  <p className="guides-resource-intro">Looking for local government, property, school and community information? <Link href="/local-resources">Browse Northeast Kansas local resources</Link>.</p>
  <div className="guide-grid">{guides.filter(g=>!g.draft).map(g=><Link href={`/guides/${g.slug}`} className="guide-card" key={g.slug}>
    <p className="eyebrow">{g.category}</p><h2>{g.title}</h2><p>{g.description}</p><span className="guide-link">Read Guide →</span>
  </Link>)}</div>
</section>}