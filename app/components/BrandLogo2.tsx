export function BrandLogo({className=''}:{className?:string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 94"
      role="img"
      aria-label="St. Mary’s Real Estate"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M8 43 L43 9 L78 43" />
        <path d="M18 39 V82 H68 V39" />
        <path d="M31 82 V57 H55 V82" />
      </g>
      <g fill="currentColor">
        <text x="98" y="48" fontFamily="Georgia, 'Times New Roman', serif" fontSize="39" letterSpacing="1.1">ST. MARY’S</text>
        <text x="101" y="77" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="600" letterSpacing="7.2">REAL ESTATE</text>
      </g>
    </svg>
  );
}
