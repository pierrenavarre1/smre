export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <img
      className={className}
      src="/images/smre-logo-white-final.png"
      alt="St. Mary’s Real Estate"
      width={1500}
      height={235}
    />
  );
}
