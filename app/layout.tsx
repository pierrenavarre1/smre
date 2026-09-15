import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import Link from 'next/link';
import { BrandLogo } from './components/BrandLogo';
import { ChatBubble } from './components/ChatBubble';

export const metadata: Metadata = {
  title: { default: 'SMRE | St. Mary’s Real Estate', template: '%s | SMRE' },
  description: 'Local real estate brokerage serving St. Marys, Wamego, and the surrounding Topeka–Manhattan market.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand-logo" aria-label="SMRE home"><BrandLogo className="logo-image" /></Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/listings">Listings</Link><Link href="/agents">Team</Link><Link href="/valuation">Home Value</Link><Link href="/about">About</Link><Link href="/contact" className="nav-cta">Contact</Link>
        </nav>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-block"><Link href="/" className="brand-logo footer-logo"><BrandLogo className="logo-image" /></Link><p>Local representation. Clear advice. Real estate without the noise.</p></div>
        <div><strong>Explore</strong><Link href="/listings">Listings</Link><Link href="/agents">Our Team</Link><Link href="/valuation">Home Value</Link><Link href="/contact">Contact</Link></div>
        <div><strong>Legal</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} SMRE. All rights reserved.</span><span>MLS attribution and disclosures are provided on listing detail pages.</span></div>
    </footer>
    <ChatBubble />
  </body></html>;
}
