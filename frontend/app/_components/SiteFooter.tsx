import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer
      style={{
        maxWidth: 980,
        margin: '60px auto 0',
        padding: '24px 24px 40px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: 13,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 24,
      }}
    >
      <div>
        <h4 style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 8px' }}>SEO Auditor</h4>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Free, comprehensive SEO + GEO audits. No signup, no paywall, ever.
        </p>
      </div>
      <div>
        <h4 style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 8px' }}>Product</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
          <li><Link href="/">Audit a site</Link></li>
          <li><Link href="/check">All checks</Link></li>
          <li><Link href="/compare">Comparisons</Link></li>
        </ul>
      </div>
      <div>
        <h4 style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 8px' }}>Learn</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
          <li><Link href="/blog">Blog</Link></li>
          <li><a href="https://llmstxt.org/" target="_blank" rel="noopener">llms.txt spec</a></li>
          <li><a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noopener">Google SEO guide</a></li>
        </ul>
      </div>
      <div>
        <h4 style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 8px' }}>Support</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
          <li><a href="https://github.com/sponsors/ravigupta" target="_blank" rel="noopener">GitHub Sponsors</a></li>
          <li><a href="https://github.com/ravigupta/seo-auditor" target="_blank" rel="noopener">Source on GitHub</a></li>
        </ul>
      </div>
    </footer>
  );
}
