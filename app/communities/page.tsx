import Link from 'next/link';

export const metadata = {
  title: 'Northeast Kansas Communities | St. Mary’s Real Estate',
  description: 'Explore St. Marys, Wamego, Manhattan, Topeka and nearby Northeast Kansas communities, with local information, resources and real estate listings.',
  alternates: { canonical: 'https://www.smre.info/communities' }
};

const communities = [
  {name:'St. Marys',slug:'st-marys',desc:'Our home base, with a historic downtown, local businesses and the surrounding Kaw Valley countryside.',photo:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85'},
  {name:'Wamego',slug:'wamego',desc:'A lively small town known for its downtown, City Park, Oz Museum and community events.',photo:'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1100&q=85'},
  {name:'Manhattan',slug:'manhattan',desc:'A university city at the edge of the Flint Hills, with established neighborhoods and regional amenities.',photo:'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1100&q=85'},
  {name:'Topeka',slug:'topeka',desc:'Kansas’ capital city, with historic districts, parks, cultural destinations and a wide range of housing.',photo:'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1100&q=85'},
  {name:'Rossville',slug:'rossville',desc:'A smaller Pottawatomie County community surrounded by rural homes, farms and open space.',photo:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85'},
  {name:'Silver Lake',slug:'silver-lake',desc:'A small-town setting northwest of Topeka, with convenient access to the capital-area region.',photo:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1100&q=85'}
];

export default function CommunitiesPage(){
 return <section className="section container communities-index">
  <style>{`.communities-index{padding-top:62px;padding-bottom:86px}.communities-intro{max-width:760px;margin-bottom:34px}.communities-intro h1{font-family:var(--serif);font-size:clamp(40px,5vw,62px);font-weight:400;line-height:1.04;letter-spacing:-.04em;margin:0 0 16px}.communities-intro>p:last-child{font-size:16px;line-height:1.75;color:var(--muted)}.communities-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.community-card{display:flex;flex-direction:column;text-decoration:none;color:var(--navy);border:1px solid var(--line);background:#fff;overflow:hidden}.community-card-photo{height:190px;background-size:cover;background-position:center;transition:transform .25s}.community-card:hover .community-card-photo{transform:scale(1.025)}.community-card-copy{padding:20px 21px 22px}.community-card h2{font-family:var(--serif);font-size:26px;font-weight:400;margin:0 0 8px}.community-card p{font-size:13px;line-height:1.65;color:var(--muted);margin:0 0 16px}.community-card span{font-size:12px;font-weight:700}.communities-foot{margin-top:34px;padding:22px 24px;background:var(--wash);font-size:13px;line-height:1.65;color:var(--muted)}@media(max-width:800px){.communities-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.communities-grid{grid-template-columns:1fr}.community-card-photo{height:175px}}`}</style>
  <div className="communities-intro"><p className="eyebrow">THE AREAS WE SERVE</p><h1>Get to Know Northeast Kansas</h1><p>Every community has its own character, housing options and local resources. Explore the areas below for a little background, useful local information and links to current properties.</p></div>
  <div className="communities-grid">{communities.map(c=><Link className="community-card" href={`/communities/${c.slug}`} key={c.slug}><div className="community-card-photo" style={{backgroundImage:`url(${c.photo})`}}/><div className="community-card-copy"><h2>{c.name}, Kansas</h2><p>{c.desc}</p><span>Explore the community →</span></div></Link>)}</div>
  <p className="communities-foot">Looking for local services, schools, government offices or property information? Visit the <Link href="/local-resources">Northeast Kansas Local Resources</Link> page. You can also browse <Link href="/guides">real estate guides</Link> for practical information about buying, selling and owning property.</p>
 </section>;
}
