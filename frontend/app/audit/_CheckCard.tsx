'use client';

import { useState } from 'react';
import Link from 'next/link';
import { findCheck } from '@/lib/checks-catalog';

export interface Check {
  id: string;
  category: string;
  severity: 'error' | 'warning' | 'info' | 'pass';
  title: string;
  evidence?: unknown;
  whyItMatters: string;
  fix: {
    summary: string;
    snippet?: string;
    steps?: string[];
    docLink: string;
  };
  priority: number;
  ruleVersion: string;
  pageUrl?: string;
  affectedPages?: string[];
}

export function CheckCard({
  check,
  index = 0,
  auditId,
  siteUrl,
}: {
  check: Check;
  index?: number;
  /** Passed through so the "fix this for me" CTA can attach the audit context. */
  auditId?: string;
  siteUrl?: string;
}) {
  const [open, setOpen] = useState(check.severity === 'error');
  const [copied, setCopied] = useState(false);

  const copySnippet = async () => {
    if (!check.fix.snippet) return;
    try {
      await navigator.clipboard.writeText(check.fix.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const animationDelay = `${Math.min(index, 12) * 30}ms`;

  // Only link to an explainer page that actually exists in the catalog.
  const explainer = findCheck(check.id);
  const needsHelp = check.severity === 'error' || check.severity === 'warning';
  const quoteParams = new URLSearchParams({ tier: 'implementation' });
  if (siteUrl) quoteParams.set('url', siteUrl);
  if (auditId) quoteParams.set('auditId', auditId);
  const quoteHref = `/quote?${quoteParams.toString()}`;

  return (
    <article
      className={`check-card check-card--${check.severity}`}
      style={{ animationDelay }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          textAlign: 'left',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span className={`severity-badge severity-badge--${check.severity}`}>{check.severity}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{check.title}</span>
        {check.affectedPages && check.affectedPages.length > 1 && (
          <span className="tag" style={{ background: 'rgba(124, 140, 255, 0.08)', borderColor: 'rgba(124, 140, 255, 0.25)', color: 'var(--accent)' }}>
            {check.affectedPages.length} pages
          </span>
        )}
        <span className="category-chip">{check.category}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 14, transition: 'transform 180ms', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-dim)', margin: '14px 0 16px', fontSize: 13, lineHeight: 1.65 }}>{check.whyItMatters}</p>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>
              ↗ Fix
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.55 }}>{check.fix.summary}</p>

            {check.fix.snippet && (
              <div style={{ position: 'relative' }}>
                <pre style={{ margin: 0, fontSize: 12.5 }}>{check.fix.snippet}</pre>
                <button
                  onClick={copySnippet}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: copied ? 'var(--pass)' : 'var(--bg-elevated)',
                    color: copied ? '#021a08' : 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}

            {check.fix.steps && (
              <ol style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13, color: 'var(--text-dim)' }}>
                {check.fix.steps.map((s, i) => <li key={i} style={{ padding: '2px 0' }}>{s}</li>)}
              </ol>
            )}

            <p style={{ margin: '12px 0 0', fontSize: 12, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {/* Internal explainer first — it keeps the reader on-site. The
                  external doc link is the fallback, not the primary path. */}
              {explainer && <Link href={`/check/${check.id}`}>What this check means →</Link>}
              <a href={check.fix.docLink} target="_blank" rel="noopener">Read the docs →</a>
            </p>

            {needsHelp && (
              <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Don&apos;t want to do this yourself?{' '}
                <Link href={quoteHref} style={{ fontWeight: 600 }}>Get it fixed for you →</Link>
              </p>
            )}
          </div>

          {check.evidence !== undefined && check.evidence !== null && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>Evidence</summary>
              <pre style={{ marginTop: 8, fontSize: 12 }}>{JSON.stringify(check.evidence, null, 2)}</pre>
            </details>
          )}

          {check.affectedPages && check.affectedPages.length > 1 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                Affects {check.affectedPages.length} pages
              </summary>
              <ul style={{ marginTop: 8, padding: '0 0 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                {check.affectedPages.slice(0, 25).map((u, i) => (
                  <li key={i} style={{ wordBreak: 'break-all', padding: '2px 0' }}>{u}</li>
                ))}
                {check.affectedPages.length > 25 && <li>… and {check.affectedPages.length - 25} more</li>}
              </ul>
            </details>
          )}
        </div>
      )}
    </article>
  );
}
