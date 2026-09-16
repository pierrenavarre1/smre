import { LeadForm } from '../components/LeadForm';

export const metadata={title:'Contact'};

export default function Contact(){
  return <section className="section container contact-page">
    <div className="contact-layout">
      <div className="contact-intro">
        <p className="eyebrow">GET IN TOUCH</p>
        <h1>Let’s talk real estate.</h1>
        <p className="lead">Have a question about a property, thinking about buying or selling, or just want to talk through an idea? Send us a note or give us a call.</p>
        <div className="contact-quick-links">
          <a className="contact-quick-card" href="tel:7854652543"><span className="contact-quick-label">CALL THE OFFICE</span><strong>(785) 465-2543</strong><span>512 W Bertrand Ave · St Marys</span></a>
          <a className="contact-quick-card" href="mailto:joseph@smre.info"><span className="contact-quick-label">EMAIL</span><strong>joseph@smre.info</strong><span>Joseph Kirby, Broker</span></a>
        </div>
        <div className="contact-note"><strong>Not sure what you need yet?</strong><p>That’s fine. Tell us what you’re thinking and we can start there.</p></div>
      </div>
      <div className="contact-form-card">
        <p className="eyebrow">SEND A MESSAGE</p>
        <h2>How can we help?</h2>
        <LeadForm kind="contact"/>
      </div>
    </div>
  </section>
}
