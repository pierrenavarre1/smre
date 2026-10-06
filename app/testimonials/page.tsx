export const metadata={title:'Client Reviews'};
import { TestimonialsReviews } from '../components/TestimonialsReviews';
import { getAdminData } from '../lib/admin-store';

export default async function Testimonials(){const {testimonials}=await getAdminData();return <section className="section container testimonials-page">
  <div className="page-intro">
    <p className="eyebrow">CLIENT REVIEWS</p>
    <h1>What our clients say.</h1>
    <p>We appreciate the people who have trusted St. Mary’s Real Estate to help them buy and sell property. Here are the reviews currently available from Google.</p>
  </div>
  <TestimonialsReviews />
  {testimonials.filter(t=>t.featured).length>0&&<div className="manual-testimonials"><p className="eyebrow">SELECTED CLIENT FEEDBACK</p><div className="about-review-grid">{testimonials.filter(t=>t.featured).sort((a,b)=>a.sort-b.sort).map(t=><blockquote key={t.id}><div className="stars">{'★'.repeat(Math.max(0,Math.round(t.rating)))}</div><span className="review-quote-text">“{t.quote}”</span><cite>— {t.name}{t.source?` · ${t.source}`:''}</cite></blockquote>)}</div></div>}
  <div className="testimonials-contact">
    <p className="eyebrow">WORK WITH US</p>
    <h2>Have a real estate question?</h2>
    <p>Give us a call or get in touch to talk through your situation.</p>
    <a className="button button-dark" href="/contact">Contact SMRE</a>
  </div>
</section>}
