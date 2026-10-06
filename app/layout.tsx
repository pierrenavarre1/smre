import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import './brand-overrides.css';
import './site-additions.css';
import './contact-reviews.css';
import './polish.css';
import Link from 'next/link';
import { BrandLogo } from './components/BrandLogoFixed';
import { ChatBubble } from './components/ChatBubble';
import { MobileMenu } from './components/MobileMenu';
import { getAdminData } from './lib/admin-store';

export async function generateMetadata():Promise<Metadata>{const {settings}=await getAdminData();return {title:{default:settings.defaultTitle||'St. Mary’s Real Estate | SMRE',template:'%s | St. Mary’s Real Estate'},description:settings.defaultDescription||'St. Mary’s Real Estate serves St. Marys, Wamego, and the surrounding Topeka–Manhattan market.'};}

export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>){
  const {settings}=await getAdminData();
  return <html lang="en"><body>
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand-logo" aria-label="St. Mary’s Real Estate home"><BrandLogo className="logo-image" /></Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a className="header-phone" href={`tel:${settings.phone.replace(/\D/g,'')}`} aria-label="Call St. Mary’s Real Estate">{settings.phone}</a>
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
          <p>{settings.address.split(',')[0]}<br />{settings.address.split(',').slice(1).join(',').trim()}<br /><a href={`tel:${settings.phone.replace(/\D/g,'')}`} style={{color:'#fff'}}>{settings.phone}</a></p>
        </div>
        <div className="footer-links">
          <strong>Explore</strong>
          <Link href="/agents">Our Team</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/about">About SMRE</Link>
          <Link href="/testimonials">Testimonials</Link>
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
        <span>MLS attribution and disclosures appear wherever IDX listings are displayed.</span>
      </div>
    </footer>
    <ChatBubble />
  </body></html>
}
