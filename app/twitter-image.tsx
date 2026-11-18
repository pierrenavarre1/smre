import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'St. Mary’s Real Estate, serving Northeast Kansas';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function TwitterImage() {
  const logo = await readFile(join(process.cwd(), 'public/images/smre-logo-white-vector.svg'));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '128px 144px', background: 'linear-gradient(135deg, #101a3d 0%, #17264c 58%, #20365d 100%)', color: '#fff', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: '56px', border: '2px solid rgba(255,255,255,.18)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: '180px', left: '200px', right: '200px', height: '2px', background: 'rgba(255,255,255,.13)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '224px', left: '200px', right: '200px', height: '2px', background: 'rgba(255,255,255,.13)', display: 'flex' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '-16px' }}>
          <img src={logoSrc} width="2000" height="314" style={{ objectFit: 'contain' }} />
          <div style={{ width: '224px', height: '8px', background: '#c5d2e8', marginTop: '70px', marginBottom: '50px', display: 'flex' }} />
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '54px', letterSpacing: '6px', color: '#e7edf7', display: 'flex' }}>HOMES  ·  LAND  ·  ACREAGE</div>
        </div>
        <div style={{ position: 'absolute', bottom: '110px', left: '0', right: '0', display: 'flex', justifyContent: 'center', fontFamily: 'Arial, sans-serif', fontSize: '42px', letterSpacing: '3px', color: '#c5d2e8' }}>
          ST. MARYS  ·  WAMEGO  ·  TOPEKA  ·  MANHATTAN, KANSAS
        </div>
      </div>
    ),
    { ...size }
  );
}
