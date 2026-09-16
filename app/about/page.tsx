export const metadata={title:'About SMRE'};
const areas=['St. Marys','Wamego','Manhattan','Topeka','Rossville','Silver Lake','St. George','Alma','Emmett','Maple Hill'];
export default function About(){return <>
<section className="section container narrow about-page">
  <div className="page-intro">
    <p className="eyebrow">ABOUT ST. MARY’S REAL ESTATE</p>
    <h1>St. Marys-based. Topeka to Manhattan.</h1>
    <p>St. Mary’s Real Estate is a local brokerage based in St. Marys, Kansas, serving buyers and sellers throughout the Topeka–Manhattan area.</p>
  </div>

  <div className="about-copy">
    <p>St. Mary’s Real Estate is a family-owned brokerage based in St. Marys, Kansas. We work with buyers and sellers throughout the area, whether they’re buying their first home, moving here from out of state, selling a longtime property, or looking for land, acreage, or an investment.</p>
    <p>Our clients work with St. Mary’s Real Estate because we know the area and have local connections that can make a real difference when buying or selling. We take the time to understand what our clients need, give them an honest perspective, and help them see the things that are worth knowing about a property. We stay involved throughout the process and make sure our clients have the information and support they need to make good decisions.</p>
    <p>That’s what we try to bring to every transaction: local knowledge, straightforward advice, and someone who stays involved when questions come up.</p>
  </div>

  <div className="about-local-points" aria-label="Local knowledge at SMRE">
    <div className="about-local-point"><p className="eyebrow">THE AREA</p><p>St. Marys, Wamego, Topeka, Manhattan and the communities between them.</p></div>
    <div className="about-local-point"><p className="eyebrow">THE PROPERTY</p><p>Homes, acreage, land, investments, commercial property and new construction.</p></div>
    <div className="about-local-point"><p className="eyebrow">THE APPROACH</p><p>Clear communication, practical advice and attention to the details that affect a real property decision.</p></div>
  </div>

  <div className="about-areas">
    <div className="about-area-card"><h3>Areas we serve</h3><p>{areas.join(' · ')}</p></div>
  </div>

  <div className="about-contact-card"><p className="eyebrow" style={{color:'#fff'}}>ST. MARYS OFFICE</p><h2>St. Mary’s Real Estate</h2><p>512 W Bertrand Ave<br />St Marys, KS 66536</p><p><a href="tel:7854652543">(785) 465-2543</a><br /><a href="mailto:admin@smre.info">admin@smre.info</a></p></div>
</section>

<section className="section container narrow"><div className="page-intro"><p className="eyebrow">CLIENT FEEDBACK</p><h2>What people say about working with SMRE.</h2><p>Published client reviews frequently mention communication, patience, local guidance and hands-on help through the buying and selling process.</p></div><div className="about-review-grid"><blockquote>“Never missed a call from me throughout the entire two-month process.”<cite>— Patrick, published SMRE client review</cite></blockquote><blockquote>“They walked us through the process” and helped us with our first home purchase.<cite>— Jim, published SMRE client review</cite></blockquote><blockquote>“Michael Kirby made my purchase experience very easy” for an out-of-state buyer moving to St. Marys.<cite>— Anne, published SMRE client review</cite></blockquote></div><p className="google-rating"><strong>Google:</strong> 5.0 stars from 26 reviews at the time this site was researched.</p></section>
</>}
