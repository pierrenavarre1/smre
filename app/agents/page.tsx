import Link from 'next/link';

const people=[
  ['Joseph Kirby','Broker','(785) 456-1001','joseph-kirby'],
  ['Thomas Kirby','Agent','(785) 456-1002','thomas-kirby'],
  ['James Frazier','Associate Broker','(785) 456-1003','james-frazier'],
  ['Michael Kirby','Agent','(785) 456-1004','michael-kirby']
];

export default function Agents(){return <>
  <section className="section container">
    <div className="page-intro"><p className="eyebrow">ST. MARY’S REAL ESTATE</p><h1>A local team, close to the details.</h1><p>Four local professionals serving St. Marys, Wamego, and the surrounding market.</p></div>
    <div className="team-grid">{people.map(([name,role,phone,slug])=><Link href={`/agents/${slug}`} className="person" key={slug}>
      <div className="avatar">{name.split(' ').map(x=>x[0]).join('')}</div>
      <p className="eyebrow">{role}</p><h2>{name}</h2><p>{phone}</p><span className="text-link">View profile →</span>
    </Link>)}</div>
  </section>
</>}
