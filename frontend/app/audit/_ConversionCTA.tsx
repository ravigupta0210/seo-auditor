'use client';

import Link from 'next/link';

interface Summary {
  overall: number;
  totals: { error: number; warning: number; info: number; pass: number };
}

/**
 * Post-audit conversion moment: shown the instant results land, while the
 * visitor is engaged. Translates the score into plain-language impact and
 * points to the /help page (and the DIY per-check fixes below it). Pure
 * on-page conversion — no outbound email, no scraping.
 */
export function ConversionCTA({ summary, url }: { summary: Summary; url: string }) {
  const { error, warning } = summary.totals;
  const fixable = error + warning;
  const score = summary.overall;
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* ignore */
  }

  if (fixable === 0) {
    return (
      <div
        className="glass-card"
        style={{ padding: '22px 24px', marginBottom: 18, background: 'var(--accent-grad-soft)', borderColor: 'var(--border-strong)' }}
      >
        <h2 style={{ margin: '0 0 6px', fontSize: 19, letterSpacing: '-0.02em' }}>{host} is in great shape ✨</h2>
        <p style={{ margin: '0 0 16px', fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          No errors or warnings — nice. Want to keep it that way, or need a hand pushing into AI-search (GEO)
          territory? We can help.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/help" className="btn btn-secondary">How we can help →</Link>
          <Link href="/blog" className="btn btn-secondary">Read the GEO guides</Link>
        </div>
      </div>
    );
  }

  const headline =
    score < 50
      ? `${host} is leaving traffic on the table`
      : score < 75
        ? `A few fixes stand between ${host} and more traffic`
        : `${host} is close — just a few tweaks to go`;

  return (
    <div
      className="glass-card"
      style={{ padding: '22px 24px', marginBottom: 18, background: 'var(--accent-grad-soft)', borderColor: 'var(--border-strong)' }}
    >
      <span className="tag" style={{ marginBottom: 10 }}>What this means</span>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, letterSpacing: '-0.02em' }}>{headline}</h2>
      <p style={{ margin: '0 0 16px', fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        The <strong style={{ color: 'var(--text)' }}>{fixable}</strong> issue{fixable === 1 ? '' : 's'} above{' '}
        {fixable === 1 ? 'is a reason' : 'are reasons'} Google — and AI answer engines like{' '}
        <strong style={{ color: 'var(--text)' }}>ChatGPT &amp; Perplexity</strong> — rank or cite your page lower.
        Fixing them is how you win back organic traffic and start getting cited in AI answers.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/help" className="btn btn-primary">See how we can help →</Link>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
        Prefer to DIY? Every issue below expands with a copy-paste fix.
      </p>
    </div>
  );
}
