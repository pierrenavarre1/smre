import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import './brand.css';
import './brand-overrides.css';
import './site-additions.css';
import './contact-reviews.css';
import './polish.css';
import Link from 'next/link';
import { BrandLogo } from './components/BrandLogo';
import { ChatBubble } from './components/ChatBubble';
import { MobileMenu } from './components/MobileMenu';
import { ExitIntentPopup } from './components/ExitIntentPopup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_ENV === 'production' ? 'https://www.smre.info' : `https://${process.env.VERCEL_URL || 'www.smre.info'}`),
  title: {
    default: 'St. Mary’s Real Estate | Homes, Land & Acreage',
    template: '%s | St. Mary’s Real Estate'
  },
  description:
    'Find homes, land and acreage in St. Marys, Wamego, Topeka and Manhattan, Kansas. Connect with St. Mary’s Real Estate for local guidance.',
  applicationName: 'St. Mary’s Real Estate',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  },
  openGraph: {
    type: 'website',
    siteName: 'St. Mary’s Real Estate',
    title: 'St. Mary’s Real Estate | Northeast Kansas',
    description: 'Find homes, land and acreage in St. Marys, Wamego, Topeka and Manhattan, Kansas. Connect with St. Mary’s Real Estate for local guidance.',
    url: 'https://www.smre.info'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'St. Mary’s Real Estate | Northeast Kansas',
    description: 'Local real estate agents serving St. Marys, Wamego, Topeka, Manhattan and surrounding Northeast Kansas communities.'
  }
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){
  const phone = '(785) 465-2543';
  const address = '512 W Bertrand Ave, St Marys, KS 66536';
  return <html lang="en">
    <head>
      <Script id="fub-widget-tracker" strategy="beforeInteractive">
        {`(function(w,i,d,g,e,t){w["WidgetTrackerObject"]=g;(w[g]=w[g]||function()
{(w[g].q=w[g].q||[]).push(arguments);}),(w[g].ds=1*new Date());(e="script"),
(t=d.createElement(e)),(e=d.getElementsByTagName(e)[0]);t.async=1;t.src=i;
e.parentNode.insertBefore(t,e);})
(window,"https://widgetbe.com/agent",document,"widgetTracker");
window.widgetTracker("create", "WT-WOVYXUPG"); window.widgetTracker("send", "pageview");`}
      </Script>
    </head>
    <body>
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand-logo" aria-label="St. Mary’s Real Estate home"><BrandLogo className="logo-image" /></Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a className="header-phone" href={`tel:${phone.replace(/\\D/g,'')}`} aria-label="Call St. Mary’s Real Estate">{phone}</a>
          <Link href="/listings">Listings</Link>
          <Link href="/valuation">Home Value</Link>
          <Link href="/about">About</Link>
          <Link href="/contact" className="nav-cta">Contact</Link>
        </nav>
        <MobileMenu />
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Link href="/" className="brand-logo footer-logo" aria-label="St. Mary’s Real Estate home"><BrandLogo className="logo-image" /></Link>
          <p>{address.split(',')[0]}<br />{address.split(',').slice(1).join(',').trim()}<br /><a href={`tel:${phone.replace(/\\D/g,'')}`} style={{color:'#fff'}}>{phone}</a></p>
        </div>
        <div className="footer-links">
          <strong>Explore</strong>
          <Link href="/agents">Our Team</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/local-resources">Local Resources</Link>
          <Link href="/about">About SMRE</Link>
          <Link href="/testimonials">Testimonials</Link>
          <Link href="/communities">Communities</Link>
        </div>
        <div className="footer-links">
          <strong>Buying &amp; Selling</strong>
          <Link href="/listings">Search Listings</Link>
          <Link href="/valuation">Home Value</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="footer-links">
          <strong>Information</strong>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/dmca">DMCA / Copyright</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} St. Mary’s Real Estate</span>
        <span>Equal Housing Opportunity · MLS attribution and disclosures appear wherever IDX listings are displayed.</span>
      </div>
    </footer>
    <ChatBubble />
    <ExitIntentPopup />
    <Analytics />
  </body></html>
}
