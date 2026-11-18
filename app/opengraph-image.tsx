import { ImageResponse } from 'next/og';

export const alt = 'St. Mary’s Real Estate | Local real estate in Northeast Kansas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 76px',
          color: '#ffffff',
          background: 'linear-gradient(115deg, #101a3d 0%, #172750 58%, #263b62 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', right: '-90px', top: '-180px', width: '620px', height: '620px', border: '1px solid rgba(255,255,255,.13)', borderRadius: '50%', display: 'flex' }} />
        <div style={{ position: 'absolute', right: '35px', top: '-45px', width: '410px', height: '410px', border: '1px solid rgba(255,255,255,.10)', borderRadius: '50%', display: 'flex' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '17px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontFamily: 'Arial, sans-serif', fontSize: 20, letterSpacing: '5px', fontWeight: 700, color: '#c9d5eb' }}>
            <div style={{ width: 46, height: 3, background: '#c9d5eb', display: 'flex' }} />
            NORTHEAST KANSAS
          </div>
          <div style={{ fontSize: 78, lineHeight: 1.02, letterSpacing: '-2px', display: 'flex', flexDirection: 'column' }}>
            <span>St. Mary’s</span>
            <span style={{ fontSize: 88 }}>Real Estate</span>
          </div>
          <div style={{ width: 100, height: 5, background: '#b9c9e5', marginTop: 12, display: 'flex' }} />
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 30, color: '#e3e9f3', letterSpacing: '.3px', marginTop: 8 }}>
            Homes · Land · Acreage
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,.28)', paddingTop: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'Arial, sans-serif' }}>
            <span style={{ fontSize: 22, color: '#ffffff' }}>St. Marys · Wamego · Topeka · Manhattan</span>
            <span style={{ fontSize: 19, color: '#c9d5eb' }}>Local real estate guidance across Northeast Kansas</span>
          </div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 24, color: '#ffffff', fontWeight: 700 }}>smre.info</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
