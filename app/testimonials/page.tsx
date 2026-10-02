export const metadata={title:'Client Reviews'};

const reviews=[
  {quote:'“Never missed a call from me throughout the entire two-month process.”',name:'Patrick'},
  {quote:'“They walked us through the process and helped us with our first home purchase.”',name:'Jim'},
  {quote:'“Michael Kirby made my purchase experience very easy for an out-of-state buyer moving to St. Marys.”',name:'Anne'},
];

export default function Testimonials(){return <section className="section container testimonials-page">
  <div className="page-intro">
    <p className="eyebrow">CLIENT REVIEWS</p>
    <h1>What our clients say.</h1>
    <p>We appreciate the people who have trusted St. Mary’s Real Estate to help them buy and sell property. Here are a few of the reviews our clients have shared.</p>
  </div>
  <div className="about-review-grid">
    {reviews.map((review)=><blockquote key={review.name}>
      <span className="review-quote-text">{review.quote}</span>
      <cite>— {review.name}, SMRE client</cite>
    </blockquote>)}
  </div>
  <div className="testimonials-contact">
    <p className="eyebrow">WORK WITH US</p>
    <h2>Have a real estate question?</h2>
    <p>Give us a call or get in touch to talk through your situation.</p>
    <a className="button button-dark" href="/contact">Contact SMRE</a>
  </div>
</section>}
