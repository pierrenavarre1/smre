import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListings } from '../../lib/listings';
import { ListingCard } from '../../components/ListingCard';
import { getAgent } from '../../lib/agents';

export default async function AgentPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const person=getAgent(slug);
  if(!person)notFound();
  const listings=(await getListings()).filter(p=>p.ListAgentFullName===person.name && (p.StandardStatus==='Active'||p.StandardStatus==='Pending'));
  return <section className="section container">
    <Link href="/agents" className="back">← Team</Link>
    <div className="agent-hero">
      <Image src={person.photo} alt={`${person.name} - ${person.role}`} width={700} height={700} className="agent-photo" unoptimized />
      <div>
        <p className="eyebrow">{person.role}</p><h1>{person.name}</h1>
        <p className="agent-bio">{person.bio}</p>
        <p className="agent-snapshot">{person.snapshot}</p>
        <p className="agent-snapshot"><strong>Areas:</strong> {person.market}</p>
        <div className="agent-contact"><a className="button button-dark" href={`tel:${person.phone.replace(/\D/g,'')}`}>Call {person.phone}</a><Link className="button button-light" href="/contact">Send a message</Link></div>
      </div>
    </div>
    <div className="agent-profile-grid">
      <div><p className="eyebrow">SPECIALTIES</p><div className="tag-list">{person.specialties.map(s=><span key={s}>{s}</span>)}</div></div>
      <div><p className="eyebrow">CLIENT FEEDBACK</p><p className="agent-review">{person.review}</p></div>
    </div>
    <div className="section-head compact"><div><p className="eyebrow">CURRENT LISTINGS</p><h2>{listings.length ? 'Properties represented by this agent.' : 'No current listings.'}</h2></div></div>
    {listings.length ? <div className="listing-grid">{listings.map(p=><ListingCard key={p.ListingId} p={p}/>)}</div> : <p className="lead">Check the full listings page for the brokerage’s current inventory.</p>}
  </section>
}
