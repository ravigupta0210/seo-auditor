import { ImageResponse } from 'next/og';

export const alt = 'SEO Auditor — Free SEO + JSON-LD + GEO audit for every public page';
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
          padding: '72px 84px',
          background:
            'radial-gradient(60% 60% at 20% 0%, rgba(139,92,246,0.45), transparent 60%),' +
            'radial-gradient(60% 60% at 90% 100%, rgba(6,182,212,0.40), transparent 65%),' +
            'linear-gradient(180deg, #0b0c0e 0%, #131519 100%)',
          color: '#eef2f7',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* Brand row with new Schema Node mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="64" height="64" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ogGrad" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#818cf8" />
                <stop offset="0.55" stopColor="#6366f1" />
                <stop offset="1" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <path d="M 6.5 12 L 25.5 7" stroke="url(#ogGrad)" strokeWidth="1.1" strokeOpacity="0.45" strokeLinecap="round" fill="none" />
            <path d="M 6.5 12 L 14 24 L 25.5 7" stroke="url(#ogGrad)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="6.5" cy="12" r="2.6" fill="url(#ogGrad)" />
            <circle cx="14" cy="24" r="2.6" fill="url(#ogGrad)" />
            <circle cx="25.5" cy="7" r="3.2" fill="url(#ogGrad)" />
          </svg>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
            SEO Auditor
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid rgba(74,222,128,0.35)',
              background: 'rgba(74,222,128,0.12)',
              color: '#34d399',
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
            Free · No signup · Built for AI search
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #b8c0cc 60%, #818cf8 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              maxWidth: 980,
            }}
          >
            Free SEO + JSON-LD + GEO audit for every public page
          </div>
          <div style={{ fontSize: 26, color: '#b8c0cc', maxWidth: 880, lineHeight: 1.4 }}>
            Classic SEO, schema validation, llms.txt, the Island Test, AI-crawler accessibility — in
            one report. No paywall.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: '1px solid rgba(124,140,255,0.18)',
          }}
        >
          <div style={{ display: 'flex', gap: 28, fontSize: 22, color: '#7a8493' }}>
            <span>90+ checks</span>
            <span style={{ color: '#3a4252' }}>·</span>
            <span>8 categories</span>
            <span style={{ color: '#3a4252' }}>·</span>
            <span>~3-5s per audit</span>
          </div>
          <div style={{ fontSize: 22, color: '#6366f1', fontWeight: 500 }}>
            freeseoaudit.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
