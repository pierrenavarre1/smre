import Link from 'next/link';
import { guides } from '../lib/guides';

export const metadata={title:'Local Real Estate Guides',description:'Practical real estate guides for St. Marys, Wamego, Topeka, Manhattan and Northeast Kansas.'};

export default function Guides(){return <section className="section container guides-page">
  <div className="page-intro">
    <p className="eyebrow">LOCAL REAL ESTATE GUIDES</p>
    <h1>Useful information for buying and selling in Northeast Kansas.</h1>
    <p>Practical guides covering homes, land, acreage and the local market. We’re building these around the questions buyers and sellers actually run into.</p>
  </div>
  <div className="guide-grid">{guides.map(g=><Link href={`/guides/${g.slug}`} className="guide-card" key={g.slug}>
    <p className="eyebrow">{g.category}</p><h2>{g.title}</h2><p>{g.description}</p><span className="guide-link">Read Guide →</span>
  </Link>)}</div>
</section>}