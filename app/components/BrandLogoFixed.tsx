const logo = 'https://s3.amazonaws.com/eap03.easyagentpro.com/wp-content/uploads/sites/1258/2022/06/01122705/SMRE-logo-white.png';

export function BrandLogo({ className = '' }: { className?: string }) {
  return <img src={logo} alt="St. Mary’s Real Estate" className={className} />;
}
