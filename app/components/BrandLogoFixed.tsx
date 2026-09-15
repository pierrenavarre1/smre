const logo = 'https://img.leadsites.biz/images?format=avif&sig=v1%3Aa17bc12cba2b76934893814dcb64930a186b1a84f6da7f0b6941e14dc7a23f23&url=aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2VhcDAzLmVhc3lhZ2VudHByby5jb20vd3AtY29udGVudC91cGxvYWRzL3NpdGVzLzEyNTgvMjAyMi8wNi8wMTEyMjcwNS9TTVJFLWxvZ28td2hpdGUucG5n&w=300';

export function BrandLogo({ className = '' }: { className?: string }) {
  return <img src={logo} alt="St. Mary’s Real Estate" className={className} />;
}
