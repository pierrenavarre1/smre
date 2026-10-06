import Link from 'next/link';
import { getAdminData } from '../lib/admin-store';

export const metadata={title:'Local Real Estate Guides',description:'Practical real estate guides for St. Marys, Wamego, Topeka, Manhattan and Northeast Kansas.'};

export default async function Guides(){const {guides}=await getAdminData();return <section className="section container guides-page">
  <div className="page-intro">
    <p className="eyebrow">LOCAL REAL ESTATE GUIDES</p>
    <h1>Real Estate Guides for Northeast Kansas</h1>
  </div>
  <div className="guide-grid">{guides.map(g=><Link href={`/guides/${g.slug}`} className="guide-card" key={g.slug}>
    <p className="eyebrow">{g.category}</p><h2>{g.title}</h2><p>{g.description}</p><span className="guide-link">Read Guide →</span>
  </Link>)}</div>
</section>}