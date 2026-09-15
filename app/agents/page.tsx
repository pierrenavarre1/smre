import Image from 'next/image';
import Link from 'next/link';

const people=[
  {
    name:'Joseph Kirby', role:'Broker', phone:'(785) 559-0551', slug:'joseph-kirby',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A659b472eaad718b6b02174026d33c236c86d63b82601d2b19b28795a3ce6cc29&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8wNTExMzgwOC9Kb3NlcGgtUHJvZmlsZS1waWN0dXJlLTAzLWNyb3AtZ29vZ2xlLXByb2ZpbGUtMTUweDE1MC5qcGc&w=1000'
  },
  {
    name:'Thomas Kirby', role:'Agent', phone:'(785) 338-3597', slug:'thomas-kirby',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A50d26ba4ff7a5bc3581122ebefdfe4959e914613d7bc914e4266af6c9d9c5b7b&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8wNjEzMjUzOS9JTUdfOTA5MV9FZGl0ZWQtMS0xNTB4MTUwLmpwZw&w=1000'
  },
  {
    name:'James Frazier', role:'Associate Broker', phone:'(936) 661-3227', slug:'james-frazier',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A3db337a4f47bb157fcda089cdf784e038f55d988e3c1f5d383ea5c146640beb8&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8yMjEwMzgyOC9KYW1lcy1wcm9maWxlLXBob3RvLTItMTUweDE1MC5qcGc&w=1000'
  },
  {
    name:'Michael Kirby', role:'Agent', phone:'(785) 491-0576', slug:'michael-kirby',
    photo:'https://img.leadsites.biz/images?format=avif&q=95&sig=v1%3A7b7c1f45b0252a468ace4f03e82c6fb67f36560cb53ecc1668416d4e122e61b0&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8wMTEzNTkzNC9JTUctMDI1Ni0xLTE1MHgxNTAuanBn&w=1000'
  }
];

export default function Agents(){return <>
  <section className="section container">
    <div className="page-intro"><p className="eyebrow">ST. MARY’S REAL ESTATE</p><h1>Meet the team.</h1><p>A local team serving St. Marys, Wamego, and communities throughout the surrounding Topeka–Manhattan market.</p></div>
    <div className="team-grid">{people.map((person)=><Link href={`/agents/${person.slug}`} className="person" key={person.slug}>
      <Image src={person.photo} alt={`${person.name} - ${person.role}`} width={700} height={700} className="team-photo" unoptimized />
      <p className="eyebrow">{person.role}</p><h2>{person.name}</h2><p>{person.phone}</p><span className="text-link">View profile →</span>
    </Link>)}</div>
  </section>
</>}
