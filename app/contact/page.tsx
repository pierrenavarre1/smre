import { LeadForm } from '../components/LeadForm';
export const metadata={title:'Contact'};
export default function Contact(){return <section className="section container narrow brand-page"><div className="brand-page-head"><p className="eyebrow">GET IN TOUCH</p><h1>Let’s talk real estate.</h1><p className="lead">Buying, selling, or somewhere in between? Tell us what you’re working on.</p></div><div className="brand-form-wrap"><LeadForm kind="contact"/></div></section>}
