export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/images/smre-logo-white-final.png"
      alt="St. Mary’s Real Estate"
      className={className}
      width={1500}
      height={235}
    />
  );
}
