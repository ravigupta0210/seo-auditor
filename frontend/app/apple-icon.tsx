import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 30% 25%, #1e1b4b 0%, #0a0d14 70%)',
        }}
      >
        <svg width="124" height="124" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradMark" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#a78bfa" />
              <stop offset="0.55" stopColor="#7c8cff" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
            <radialGradient id="nodeGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#a78bfa" stopOpacity="0.55" />
              <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Glow halos behind nodes for extra depth at 180px */}
          <circle cx="6.5" cy="12" r="5" fill="url(#nodeGlow)" />
          <circle cx="14" cy="24" r="5" fill="url(#nodeGlow)" />
          <circle cx="25.5" cy="7" r="6" fill="url(#nodeGlow)" />
          {/* Triangle closure */}
          <path
            d="M 6.5 12 L 25.5 7"
            stroke="url(#gradMark)"
            strokeWidth="1.1"
            strokeOpacity="0.45"
            strokeLinecap="round"
            fill="none"
          />
          {/* Check stroke */}
          <path
            d="M 6.5 12 L 14 24 L 25.5 7"
            stroke="url(#gradMark)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Nodes */}
          <circle cx="6.5" cy="12" r="2.6" fill="url(#gradMark)" />
          <circle cx="14" cy="24" r="2.6" fill="url(#gradMark)" />
          <circle cx="25.5" cy="7" r="3.2" fill="url(#gradMark)" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
