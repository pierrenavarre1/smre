import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'St. Mary’s Real Estate, serving Northeast Kansas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TwitterImage() {
  const logo = await readFile(join(process.cwd(), 'public/images/smre-logo-white-1500x235.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 72px', background: 'linear-gradient(135deg, #101a3d 0%, #17264c 58%, #20365d 100%)', color: '#fff', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: '28px', border: '1px solid rgba(255,255,255,.18)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: '90px', left: '100px', right: '100px', height: '1px', background: 'rgba(255,255,255,.13)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '112px', left: '100px', right: '100px', height: '1px', background: 'rgba(255,255,255,.13)', display: 'flex' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '-8px' }}>
          <img src={logoSrc} width="1000" height="157" style={{ objectFit: 'contain' }} />
          <div style={{ width: '112px', height: '4px', background: '#c5d2e8', marginTop: '35px', marginBottom: '25px', display: 'flex' }} />
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '27px', letterSpacing: '3px', color: '#e7edf7', display: 'flex' }}>HOMES  ·  LAND  ·  ACREAGE</div>
        </div>
        <div style={{ position: 'absolute', bottom: '55px', left: '0', right: '0', display: 'flex', justifyContent: 'center', fontFamily: 'Arial, sans-serif', fontSize: '21px', letterSpacing: '1.5px', color: '#c5d2e8' }}>
          ST. MARYS  ·  WAMEGO  ·  TOPEKA  ·  MANHATTAN, KANSAS
        </div>
      </div>
    ),
    { ...size }
  );
}
