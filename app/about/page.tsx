export const metadata={title:'About'};

const areasOne=['Manhattan','Rossville','Silver Lake','Topeka','St. George'];
const areasTwo=['Alma','Emmett','Maple Hill','Wamego','St. Marys'];

export default function About(){return <>
  <section className="section container narrow about-page">
    <div className="page-intro"><p className="eyebrow">ABOUT ST. MARY’S REAL ESTATE</p><h1>Local real estate, with people you can reach.</h1><p>St. Mary’s Real Estate is based in St. Marys, Kansas, and serves buyers and sellers throughout the surrounding market.</p></div>
    <div className="about-copy">
      <p>We help clients search current listings, understand their options, and move through the buying or selling process with direct communication and local representation.</p>
      <p>The market we serve stretches from St. Marys and Wamego through Topeka, Manhattan, and the smaller communities in between. That includes homes, land, acreage, and other property.</p>
    </div>
    <div className="about-areas">
      <div className="about-area-card"><h3>Areas we serve</h3><p>{areasOne.join(' · ')}</p></div>
      <div className="about-area-card"><h3>More of the area</h3><p>{areasTwo.join(' · ')}</p></div>
    </div>
    <div className="about-contact-card">
      <p className="eyebrow" style={{color:'#fff'}}>ST. MARYS OFFICE</p>
      <h2>St. Mary’s Real Estate</h2>
      <p>512 W Bertrand Ave<br />St Marys, KS 66536</p>
      <p><a href="tel:7855590551">(785) 559-0551</a><br /><a href="mailto:joseph@smre.info">joseph@smre.info</a></p>
    </div>
  </section>
</>}
