import Link from 'next/link';

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const fontSize = size === 'sm' ? 14 : 16;
  const dot = size === 'sm' ? 20 : 24;
  return (
    <Link href="/" className="brand-mark" style={{ textDecoration: 'none', fontSize }}>
      <span className="brand-mark__dot" style={{ width: dot, height: dot }} />
      <span>SEO Auditor</span>
    </Link>
  );
}
