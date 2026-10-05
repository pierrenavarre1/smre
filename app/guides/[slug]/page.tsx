import { notFound } from 'next/navigation';
import Link from 'next/link';
import { guides, getGuide, countySources } from '../../lib/guides';

export async function generateStaticParams(){return guides.map(g=>({slug:g.slug}));}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const g=getGuide(slug);
  return g?{title:g.title,description:g.description}:{}; 
}

export default async function GuidePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const g=getGuide(slug); if(!g)notFound();
  return <article className="section container guide-detail">
    <Link href="/guides" className="back">← All Guides</Link>
    <div className="guide-detail-intro">
      <p className="eyebrow">{g.category}</p><h1>{g.title}</h1><p className="guide-intro">{g.intro}</p>
    </div>
    <div className="guide-content">{g.sections.map(s=><section key={s.heading}><h2>{s.heading}</h2><p>{s.body}</p></section>)}</div>
    <div className="guide-source-note"><p className="eyebrow">OFFICIAL COUNTY SOURCES</p><p>County regulations and procedures can change. For property-specific questions, verify the current requirements with Pottawatomie County Planning and Zoning.</p><div>{countySources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</div></div>
    <div className="guide-cta"><p className="eyebrow">HAVE A QUESTION?</p><h2>Talk through your property plans.</h2><p>Whether you’re buying, selling or looking at land, we’re happy to help you sort through the local questions.</p><Link href="/contact" className="button button-dark">Contact SMRE</Link></div>
  </article>;
}
