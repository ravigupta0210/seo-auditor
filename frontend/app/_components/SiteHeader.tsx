import Link from 'next/link';
import { BrandMark } from './BrandMark';

export function SiteHeader() {
  return (
    <header
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '22px 24px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <BrandMark />
      <nav style={{ display: 'flex', gap: 22, fontSize: 14, color: 'var(--text-dim)' }}>
        <Link href="/check" style={{ color: 'inherit' }}>Checks</Link>
        <Link href="/compare" style={{ color: 'inherit' }}>Compare</Link>
        <Link href="/blog" style={{ color: 'inherit' }}>Blog</Link>
        <a
          href="https://github.com/ravigupta/seo-auditor"
          target="_blank"
          rel="noopener"
          style={{ color: 'inherit' }}
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
