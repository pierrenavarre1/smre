export const metadata={title:'Client Reviews'};
import { TestimonialsReviews } from '../components/TestimonialsReviews';

export default function Testimonials(){return <section className="section container testimonials-page">
  <div className="page-intro">
    <p className="eyebrow">CLIENT REVIEWS</p>
    <h1>What our clients say.</h1>
    <p>We appreciate the people who have trusted St. Mary’s Real Estate to help them buy and sell property. Here are the reviews currently available from Google.</p>
  </div>
  <TestimonialsReviews />
  <div className="testimonials-contact">
    <p className="eyebrow">WORK WITH US</p>
    <h2>Have a real estate question?</h2>
    <p>Give us a call or get in touch to talk through your situation.</p>
    <a className="button button-dark" href="/contact">Contact SMRE</a>
  </div>
</section>}
