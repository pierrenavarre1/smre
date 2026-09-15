import { LeadForm } from '../components/LeadForm';
export const metadata={title:'Home Value'};
export default function Valuation(){return <section className="section container narrow brand-page"><div className="brand-page-head"><p className="eyebrow">HOME VALUE</p><h1>What could your home sell for?</h1><p className="lead">Request a manual comparative market analysis from the SMRE team. We’ll review the property, recent comparable sales, and current competition.</p></div><div className="brand-form-wrap"><LeadForm kind="valuation"/></div></section>}
