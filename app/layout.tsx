import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import Link from 'next/link';
import { BrandLogo } from './components/BrandLogo';
import { ChatBubble } from './components/ChatBubble';

export const metadata: Metadata = {
  title: { default: 'St. Mary’s Real Estate | SMRE', template: '%s | St. Mary’s Real Estate' },
  description: 'St. Mary’s Real Estate serves St. Marys, Wamego, and the surrounding Topeka–Manhattan market.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand-logo" aria-label="St. Mary’s Real Estate home">
          <BrandLogo className="logo-image logo-dark" />
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/listings">Listings</Link>
          <Link href="/agents">Our Team</Link>
          <Link href="/valuation">Home Value</Link>
          <Link href="/about">About</Link>
          <Link href="/contact" className="nav-cta">Contact</Link>
        </nav>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Link href="/" className="brand-logo footer-logo" aria-label="St. Mary’s Real Estate home">
            <BrandLogo className="logo-image logo-light" />
          </Link>
          <p>St. Marys, Kansas<br />Local representation. Clear advice.</p>
        </div>
        <div className="footer-links"><strong>Explore</strong><Link href="/listings">Listings</Link><Link href="/agents">Our Team</Link><Link href="/valuation">Home Value</Link><Link href="/contact">Contact</Link></div>
        <div className="footer-links"><strong>Information</strong><Link href="/about">About SMRE</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} St. Mary’s Real Estate</span><span>MLS attribution and disclosures appear on listing detail pages.</span></div>
    </footer>
    <ChatBubble />
  </body></html>;
}
