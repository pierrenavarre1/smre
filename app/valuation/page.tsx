import { LeadForm } from '../components/LeadForm';
import styles from './valuation.module.css';

export const metadata = {
  title: 'Free Home Market Analysis | St. Mary’s Real Estate',
  description: 'Find out what your Northeast Kansas home may be worth with a free, personalized market analysis from St. Mary’s Real Estate. No cost and no obligation.',
};

const steps = [
  { number: '01', title: 'We review your property', text: 'We start with the details you provide and take a closer look at the features, condition, and location of your home.' },
  { number: '02', title: 'We research the local market', text: 'We review recent comparable sales and the homes currently competing for buyers in your area.' },
  { number: '03', title: 'We discuss the results', text: 'An SMRE agent will follow up to walk through a realistic pricing range and answer your questions, with no pressure to list.' },
];

const questions = [
  { question: 'Is this actually free?', answer: 'Yes. There is no cost, no obligation to list, and no strings attached. We believe homeowners should be able to understand what their property may be worth before making any decisions.' },
  { question: 'How is a market analysis different from an online estimate?', answer: 'Online estimates rely on public records and automated calculations. They cannot walk through your home, evaluate its condition, or fully account for improvements, acreage, outbuildings, and other details that matter locally. A Comparative Market Analysis is prepared by an agent who reviews your property alongside recent comparable sales and current competition.' },
  { question: 'Do I need to be ready to sell?', answer: 'Not at all. You may be planning a move, thinking ahead, reviewing your finances, or simply curious. You do not need to have a timeline or a decision made.' },
  { question: 'What areas do you serve?', answer: 'We work throughout Northeast Kansas, including St. Marys, Wamego, Rossville, Silver Lake, Topeka, Manhattan, and surrounding communities. If your property is outside those areas, reach out and we can let you know if we can help.' },
  { question: 'How long does it take?', answer: 'Timing depends on the property and the availability of comparable sales. We will follow up to confirm the details and let you know what to expect.' },
];

export default function Valuation() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>COMPLIMENTARY HOME MARKET ANALYSIS</p>
          <h1>What is your home worth in today’s market?</h1>
          <p className={styles.heroLead}>Get a clearer picture of what your property could sell for with a personalized market analysis from people who know Northeast Kansas.</p>
          <div className={styles.trustLine}>
            <span>Local MLS data and analysis</span><i />
            <span>No cost</span><i />
            <span>No obligation</span>
          </div>
          <a className={styles.heroButton} href="#request-analysis">Request your free analysis</a>
        </div>
      </section>

      <section className={styles.intro}>
        <div className={styles.introCopy}>
          <p className={styles.eyebrowDark}>UNDERSTANDING YOUR HOME’S VALUE</p>
          <h2>What is your home worth right now?</h2>
          <p>If you have ever entered your address into Zillow or another online home value estimator, you may have noticed that the number does not always seem quite right. That is because an online estimate cannot walk through your property. It does not know about the kitchen you renovated, the condition of the roof, the extra garage space, or the features that make your property different from the one down the road.</p>
          <p>A Comparative Market Analysis, or CMA, takes a closer look. It is an agent-prepared evaluation of what buyers are actually paying for homes like yours in your area. We review recent MLS sales, consider your property’s features, and look at the homes currently competing for buyers to develop a pricing range grounded in the local market.</p>
          <p>Share a few details about your property and an SMRE agent will prepare a personalized analysis, completely free and with no pressure to sell.</p>
        </div>
        <aside className={styles.accuracyCard}>
          <span className={styles.accuracyMark}>01</span>
          <h3>Why pricing accuracy matters</h3>
          <p>Pricing a property correctly from the start can make a meaningful difference. A price that is too high can cause a home to sit on the market, while a thoughtful price helps attract qualified buyers and puts you in a better position to evaluate offers.</p>
          <p>A local market analysis gives you information you can use to make a more informed decision.</p>
        </aside>
      </section>

      <section className={styles.requestSection} id="request-analysis">
        <div className={styles.requestIntro}>
          <p className={styles.eyebrow}>START WITH A FEW DETAILS</p>
          <h2>Request your free home market analysis.</h2>
          <p>Tell us a little about yourself and your property. The more detail you can share, the better we can understand what makes your home unique.</p>
          <ul>
            <li>There is no cost for the analysis.</li>
            <li>You are not committing to list your property.</li>
            <li>Your information goes directly to the SMRE team.</li>
          </ul>
        </div>
        <div className={styles.formPanel}>
          <div className={styles.formPanelHead}>
            <span>SMRE HOME VALUE REQUEST</span>
            <h3>Tell us about your property</h3>
          </div>
          <LeadForm kind="valuation" />
        </div>
      </section>

      <section className={styles.process}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrowDark}>WHAT HAPPENS NEXT</p>
          <h2>A straightforward process.</h2>
          <p>Once you send your request, here is what you can expect.</p>
        </div>
        <div className={styles.steps}>
          {steps.map((step) => <article className={styles.step} key={step.number}>
            <span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p>
          </article>)}
        </div>
      </section>

      <section className={styles.why}>
        <div>
          <p className={styles.eyebrow}>LOCAL KNOWLEDGE MATTERS</p>
          <h2>Your property deserves more than an automated estimate.</h2>
        </div>
        <div className={styles.whyCopy}>
          <p>Property values can change from one community to the next, and sometimes from one road to another. A home in St. Marys is not necessarily comparable to one in Topeka or Manhattan. Acreage, rural water, outbuildings, condition, updates, and location can all affect what buyers are willing to pay.</p>
          <p>St. Mary’s Real Estate is a second-generation, family-owned brokerage serving Northeast Kansas. We work with buyers and sellers across the area and understand the local details that can make a difference when evaluating a property.</p>
          <p>A market analysis is a starting point. Whether you are considering selling soon, planning for next year, or simply want to know where you stand, you deserve useful information before making a decision.</p>
        </div>
      </section>

      <section className={styles.faq}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrowDark}>COMMON QUESTIONS</p>
          <h2>Home value questions, answered.</h2>
        </div>
        <div className={styles.questions}>
          {questions.map((item) => <details key={item.question}>
            <summary>{item.question}</summary><p>{item.answer}</p>
          </details>)}
        </div>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.eyebrow}>NO COST. NO OBLIGATION.</p>
        <h2>Ready to find out what your home may be worth?</h2>
        <p>Send us a few details about your property and let the SMRE team help you understand the local market.</p>
        <a href="#request-analysis">Request your free analysis</a>
      </section>
    </main>
  );
}
