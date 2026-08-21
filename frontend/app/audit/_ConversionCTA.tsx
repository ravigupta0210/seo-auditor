'use client';

import Link from 'next/link';
import { track } from '@/lib/analytics';

interface Summary {
  overall: number;
  totals: { error: number; warning: number; info: number; pass: number };
}

/**
 * Post-audit conversion moment: shown the instant results land, while the
 * visitor is engaged. Translates the score into plain-language impact and
 * points at /quote with the audit attached, so we price against their real
 * findings instead of a generic pitch. The DIY per-check fixes sit below it.
 */
export function ConversionCTA({ summary, url, auditId }: { summary: Summary; url: string; auditId?: string }) {
  const { error, warning } = summary.totals;
  const fixable = error + warning;
  const score = summary.overall;
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* ignore */
  }

  // Carry the audit context into the quote form so we quote against real results.
  function quoteHref(tier: string): string {
    const q = new URLSearchParams({ tier, url });
    if (auditId) q.set('auditId', auditId);
    q.set('score', String(score));
    return `/quote?${q.toString()}`;
  }

  if (fixable === 0) {
    return (
      <div
        className="glass-card"
        style={{ padding: '22px 24px', marginBottom: 18, background: 'var(--accent-grad-soft)', borderColor: 'var(--border-strong)' }}
      >
        <h2 style={{ margin: '0 0 6px', fontSize: 19, letterSpacing: '-0.02em' }}>{host} is in great shape ✨</h2>
        <p style={{ margin: '0 0 16px', fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          No errors or warnings — nice. The hard part is keeping it that way: one deploy can strip a canonical or
          block an AI crawler, and nothing tells you. We watch for that from $149/mo.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href={quoteHref('monitoring')}
            className="btn btn-secondary"
            onClick={() => track('help_cta_clicked', { url, score, tier: 'monitoring' })}
          >
            Keep it monitored →
          </Link>
          <Link href="/services" className="btn btn-secondary">See what we do</Link>
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
        <Link
          href={quoteHref('implementation')}
          className="btn btn-primary"
          onClick={() => track('help_cta_clicked', { url, score, tier: 'implementation' })}
        >
          Get these fixed for me →
        </Link>
        <Link href="/services" className="btn btn-secondary">What it costs</Link>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Fixed price from $799, delivered as a pull request in 72 hours — agencies charge $1,500–$5,000 and send a PDF.{' '}
        <strong style={{ color: 'var(--text-dim)' }}>Prefer to DIY?</strong> Every issue below expands with a copy-paste fix.
      </p>
    </div>
  );
}
