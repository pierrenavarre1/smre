import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListings } from '../../lib/listings';
import { ListingCard } from '../../components/ListingCard';

const people:{[key:string]:{name:string;role:string;phone:string;photo:string}}={
  'joseph-kirby':{
    name:'Joseph Kirby',role:'Broker',phone:'(785) 559-0551',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A659b472eaad718b6b02174026d33c236c86d63b82601d2b19b28795a3ce6cc29&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8wNTExMzgwOC9Kb3NlcGgtUHJvZmlsZS1waWN0dXJlLTAzLWNyb3AtZ29vZ2xlLXByb2ZpbGUtMTUweDE1MC5qcGc&w=1000'
  },
  'thomas-kirby':{
    name:'Thomas Kirby',role:'Agent',phone:'(785) 338-3597',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A50d26ba4ff7a5bc3581122ebefdfe4959e914613d7bc914e4266af6c9d9c5b7b&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8wNjEzMjUzOS9JTUdfOTA5MV9FZGl0ZWQtMS0xNTB4MTUwLmpwZw&w=1000'
  },
  'james-frazier':{
    name:'James Frazier',role:'Associate Broker',phone:'(936) 661-3227',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A3db337a4f47bb157fcda089cdf784e038f55d988e3c1f5d383ea5c146640beb8&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8yMjEwMzgyOC9KYW1lcy1wcm9maWxlLXBob3RvLTItMTUweDE1MC5qcGc&w=1000'
  },
  'michael-kirby':{
    name:'Michael Kirby',role:'Agent',phone:'(785) 491-0576',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A7b7c1f45b0252a468ace4f03e82c6fb67f36560cb53ecc1668416d4e122e61b0&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8wMTEzNTkzNC9JTUctMDI1Ni0xLTE1MHgxNTAuanBn&w=1000'
  }
};

export default async function AgentPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const person=people[slug];
  if(!person)notFound();
  const listings=(await getListings()).filter(p=>p.ListAgentFullName===person.name && p.StandardStatus==='Active');
  return <section className="section container">
    <Link href="/agents" className="back">← Team</Link>
    <div className="agent-hero">
      <Image src={person.photo} alt={`${person.name} - ${person.role}`} width={700} height={700} className="agent-photo" unoptimized />
      <div>
        <p className="eyebrow">{person.role}</p>
        <h1>{person.name}</h1>
        <p className="agent-bio">{person.role} with St. Mary’s Real Estate.</p>
        <div className="agent-contact">
          <a className="button button-dark" href={`tel:${person.phone.replace(/\D/g,'')}`}>Call {person.phone}</a>
          <Link className="button button-light" href="/contact">Send a message</Link>
        </div>
      </div>
    </div>
    <div className="section-head compact"><div><p className="eyebrow">CURRENT LISTINGS</p><h2>{listings.length ? 'Properties represented by this agent.' : 'Listings'}</h2></div></div>
    {listings.length ? <div className="listing-grid">{listings.map(p=><ListingCard key={p.ListingId} p={p}/>)}</div> : <p className="lead">No current listings are displayed for this agent.</p>}
  </section>
}
