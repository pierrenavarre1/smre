import Image from 'next/image';
import Link from 'next/link';
import { agents } from '../lib/agents';

export default function Agents(){return <>
  <section className="section container">
    <div className="page-intro"><p className="eyebrow">ST. MARY’S REAL ESTATE</p><h1>Meet the team.</h1><p>A local brokerage serving St. Marys, Wamego, Topeka, Manhattan and the smaller communities in between.</p></div>
    <div className="team-grid">{agents.map(person=><Link href={`/agents/${person.slug}`} className="person" key={person.slug}>
      <Image src={person.photo} alt={`${person.name} - ${person.role}`} width={700} height={700} className="team-photo" unoptimized />
      <p className="eyebrow">{person.role}</p><h2>{person.name}</h2><p>{person.phone}</p><p className="person-bio">{person.bio}</p><span className="text-link">View profile →</span>
    </Link>)}</div>
  </section>
</>}
