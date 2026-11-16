import logo from "../../public/images/smre-logo-white-clean.png";

export function BrandLogo({className=''}:{className?:string}) {
  return (
    <img
      className={className}
      src={logo.src}
      alt="St. Mary’s Real Estate"
      width={1500}
      height={235}
    />
  );
}
