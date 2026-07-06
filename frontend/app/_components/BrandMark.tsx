import Link from 'next/link';

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const fontSize = size === 'sm' ? 14 : 16;
  const dim = size === 'sm' ? 22 : 26;
  return (
    <Link href="/" className="brand-mark" style={{ textDecoration: 'none', fontSize }}>
      <SchemaNodeMark dim={dim} />
      <span>SEO Auditor</span>
    </Link>
  );
}

function SchemaNodeMark({ dim }: { dim: number }) {
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="brand-mark-grad" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="0.55" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path
        d="M 6.5 12 L 25.5 7"
        stroke="url(#brand-mark-grad)"
        strokeWidth="1.2"
        strokeOpacity="0.45"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 6.5 12 L 14 24 L 25.5 7"
        stroke="url(#brand-mark-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="6.5" cy="12" r="2.6" fill="url(#brand-mark-grad)" />
      <circle cx="14" cy="24" r="2.6" fill="url(#brand-mark-grad)" />
      <circle cx="25.5" cy="7" r="3.2" fill="url(#brand-mark-grad)" />
    </svg>
  );
}
