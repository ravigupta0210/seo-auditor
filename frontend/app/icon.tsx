import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

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
          background: 'linear-gradient(135deg, #8b5cf6 0%, #5a6dff 50%, #06b6d4 100%)',
          color: '#ffffff',
          fontSize: 19,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          borderRadius: 7,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        SA
      </div>
    ),
    { ...size },
  );
}
