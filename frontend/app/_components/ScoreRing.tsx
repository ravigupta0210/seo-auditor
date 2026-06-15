export interface ScoreRingProps {
  score: number;
  size?: number;
  showGrade?: boolean;
}

export function ScoreRing({ score, size = 130, showGrade = true }: ScoreRingProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - safe / 100);

  const color =
    safe >= 90 ? '#4ade80' :
    safe >= 75 ? '#86efac' :
    safe >= 60 ? '#facc15' :
    safe >= 40 ? '#fb923c' :
    '#ef4444';

  const grade =
    safe >= 90 ? 'A' :
    safe >= 75 ? 'B' :
    safe >= 60 ? 'C' :
    safe >= 40 ? 'D' :
    'F';

  // Fluid on small screens: scale down with the viewport, never above `size`.
  const dim = `clamp(92px, 26vw, ${size}px)`;

  return (
    <div style={{ position: 'relative', width: dim, height: dim, flexShrink: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="score-ring">
        <defs>
          <linearGradient id={`ring-grad-${safe}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
          <filter id={`glow-${safe}`}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle className="score-ring__track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="score-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#ring-grad-${safe})`}
          strokeDasharray={c}
          strokeDashoffset={offset}
          filter={`url(#glow-${safe})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: `clamp(26px, 8vw, ${size * 0.32}px)`, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {safe}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
          / 100 {showGrade && <span style={{ color, fontWeight: 700, marginLeft: 4 }}>· {grade}</span>}
        </div>
      </div>
    </div>
  );
}
