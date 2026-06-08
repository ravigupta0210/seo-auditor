import { ImageResponse } from 'next/og';
import { getAllPosts, getPost } from '@/lib/blog';

export const alt = 'SEO Auditor blog post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generate one OG image per known post at build time (fs runs at build, never
// at runtime). Pairs with `dynamicParams = false` on the page route.
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.title ?? 'SEO Auditor';
  const tag = post?.tag ?? 'Guide';

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
            'radial-gradient(60% 60% at 15% 0%, rgba(139,92,246,0.45), transparent 60%),' +
            'radial-gradient(60% 60% at 95% 100%, rgba(6,182,212,0.40), transparent 65%),' +
            'linear-gradient(180deg, #06070b 0%, #0a0d14 100%)',
          color: '#eef2f7',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset="0.55" stopColor="#7c8cff" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <path d="M 6.5 12 L 14 24 L 25.5 7" stroke="url(#g)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="6.5" cy="12" r="2.6" fill="url(#g)" />
            <circle cx="14" cy="24" r="2.6" fill="url(#g)" />
            <circle cx="25.5" cy="7" r="3.2" fill="url(#g)" />
          </svg>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>SEO Auditor</div>
          <div
            style={{
              marginLeft: 'auto',
              padding: '8px 18px',
              borderRadius: 999,
              border: '1px solid rgba(124,140,255,0.4)',
              background: 'rgba(124,140,255,0.14)',
              color: '#a9b4ff',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {tag}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 70 ? 60 : 76,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #c2cad6 55%, #8b5cf6 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            maxWidth: 1020,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 26,
            borderTop: '1px solid rgba(124,140,255,0.18)',
            fontSize: 22,
          }}
        >
          <span style={{ color: '#7a8493' }}>Free SEO + GEO audit · No signup</span>
          <span style={{ color: '#7c8cff', fontWeight: 500 }}>freeseoaudit.vercel.app</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
