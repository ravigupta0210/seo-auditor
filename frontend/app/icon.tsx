import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Schema Node favicon — three nodes connected to form both a knowledge-graph
 * triad and a checkmark. References JSON-LD structured data + audit-pass.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#131519',
          borderRadius: 7,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#818cf8" />
              <stop offset="0.55" stopColor="#6366f1" />
              <stop offset="1" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          {/* Triangle closure — subtle, indicates this is a graph */}
          <path
            d="M 6.5 12 L 25.5 7"
            stroke="url(#g)"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Check stroke: upper-left → bottom vertex → upper-right */}
          <path
            d="M 6.5 12 L 14 24 L 25.5 7"
            stroke="url(#g)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Three nodes */}
          <circle cx="6.5" cy="12" r="2.6" fill="url(#g)" />
          <circle cx="14" cy="24" r="2.6" fill="url(#g)" />
          <circle cx="25.5" cy="7" r="3.2" fill="url(#g)" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
