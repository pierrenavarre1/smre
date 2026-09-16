import { LeadForm } from '../components/LeadForm';
export const metadata={title:'Home Value'};
export default function Valuation(){return <section className="section container narrow brand-page"><div className="brand-page-head"><p className="eyebrow">HOME VALUE</p><h1>What could your home sell for?</h1><p className="lead">An SMRE agent will review your property, recent comparable sales, and the current competition to give you an idea of what your home could sell for.</p></div><div className="brand-form-wrap"><LeadForm kind="valuation"/></div></section>}
