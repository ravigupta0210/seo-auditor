'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { submitQuote, type QuoteTier } from '@/lib/api';
import { QUOTE_TIER_OPTIONS, NO_GUARANTEE } from '@/lib/services';
import { track } from '@/lib/analytics';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const TIMELINES = ['As soon as possible', 'Within 2 weeks', 'This month', 'Just exploring'];
const BUDGETS = ['Under $250', '$250 – $750', '$750 – $1,500', '$1,500 – $3,000', '$3,000+', 'Not sure yet'];

export function QuoteForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [tier, setTier] = useState('');
  const [stack, setStack] = useState('');
  const [requirements, setRequirements] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budget, setBudget] = useState('');
  const [repoAccess, setRepoAccess] = useState('');
  const [website, setWebsite] = useState(''); // honeypot

  const [auditId, setAuditId] = useState('');
  const [auditScore, setAuditScore] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  // Read context off the URL rather than useSearchParams() so this page stays
  // statically prerendered (same pattern as the feedback form).
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const url = q.get('url');
      const id = q.get('auditId');
      const t = q.get('tier');
      const score = q.get('score');
      if (url) setSiteUrl(url);
      if (id) setAuditId(id);
      if (score) setAuditScore(score);
      if (t && QUOTE_TIER_OPTIONS.some((o) => o.value === t)) setTier(t);
    } catch {
      /* ignore */
    }
  }, []);

  /** Fire once, the first time someone actually engages with the form. */
  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track('quote_started', { hasAudit: Boolean(auditId) });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteUrl.trim()) {
      setStatus('error');
      setError('Please tell us which site this is for.');
      return;
    }
    if (requirements.trim().length < 10) {
      setStatus('error');
      setError('Please describe what you need in a bit more detail.');
      return;
    }
    setStatus('sending');
    setError('');
    const res = await submitQuote({
      name: name.trim() || undefined,
      email: email.trim(),
      company: company.trim() || undefined,
      siteUrl: siteUrl.trim(),
      auditId: auditId || undefined,
      tier: (tier || undefined) as QuoteTier | undefined,
      stack: stack.trim() || undefined,
      requirements: requirements.trim(),
      timeline: timeline || undefined,
      budget: budget || undefined,
      repoAccess: (repoAccess || undefined) as 'yes' | 'no' | 'maybe' | undefined,
      website,
    });
    if (res.ok) {
      track('quote_submitted', { tier: tier || 'unspecified', hasAudit: Boolean(auditId), budget: budget || 'unspecified' });
      setStatus('done');
    } else {
      setStatus('error');
      setError(res.error || 'Something went wrong. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <div className="glass-card" style={{ padding: '40px 28px', textAlign: 'center' }}>
        <span className="modal-badge is-success" style={{ marginBottom: 18 }}>
          <CheckIcon />
        </span>
        <h2 style={{ margin: '0 0 8px', fontSize: 23, letterSpacing: '-0.02em' }}>Got it — we&apos;ll price this up</h2>
        <p style={{ margin: '0 auto 10px', maxWidth: 420, color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.6 }}>
          We&apos;ll email you a fixed price within <strong style={{ color: 'var(--text)' }}>1 business day</strong>. Check
          your inbox — a confirmation is already on its way.
        </p>
        <p style={{ margin: '0 auto 22px', maxWidth: 420, color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.6 }}>
          No obligation, and no sales sequence. If the price doesn&apos;t work, just say so.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {auditId ? (
            <Link href={`/audit/${auditId}`} className="btn btn-primary">Back to your report</Link>
          ) : (
            <Link href="/" className="btn btn-primary">Run another audit</Link>
          )}
          <Link href="/blog" className="btn btn-secondary">Read the GEO guides</Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocus={markStarted}
      className="glass-card"
      style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      {auditId && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            padding: '11px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-grad-soft)', border: '1px solid var(--border)',
            fontSize: 13.5, color: 'var(--text-dim)',
          }}
        >
          <span className="tag" style={{ margin: 0 }}>Audit attached</span>
          <span>
            We&apos;ll quote against your actual results
            {auditScore ? <> — scored <strong style={{ color: 'var(--text)' }}>{auditScore}/100</strong></> : null}.
          </span>
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="q-site">Which site is this for?</label>
        <input
          id="q-site" required className="field-input" value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="yourdomain.com" maxLength={2048} autoComplete="url"
        />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="field-label" htmlFor="q-email">Email</label>
          <input
            id="q-email" type="email" required className="field-input" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" maxLength={254} autoComplete="email"
          />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label className="field-label" htmlFor="q-name">
            Name <span className="field-optional">(optional)</span>
          </label>
          <input id="q-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} autoComplete="name" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label className="field-label" htmlFor="q-company">
            Company <span className="field-optional">(optional)</span>
          </label>
          <input id="q-company" className="field-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc" maxLength={160} autoComplete="organization" />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label className="field-label" htmlFor="q-stack">
            Tech stack <span className="field-optional">(optional)</span>
          </label>
          <input id="q-stack" className="field-input" value={stack} onChange={(e) => setStack(e.target.value)} placeholder="Next.js, Webflow, WordPress…" maxLength={300} />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="q-tier">What are you after?</label>
        <select id="q-tier" className="field-input" value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">Choose one…</option>
          {QUOTE_TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="q-req">What do you need done?</label>
        <textarea
          id="q-req" required className="field-input" value={requirements}
          onChange={(e) => {
            setRequirements(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Tell us what's going on — what you've already tried, what matters most, and anything unusual about the site. The more detail, the more accurate the price."
          rows={6} maxLength={5000}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 170px' }}>
          <label className="field-label" htmlFor="q-timeline">
            Timeline <span className="field-optional">(optional)</span>
          </label>
          <select id="q-timeline" className="field-input" value={timeline} onChange={(e) => setTimeline(e.target.value)}>
            <option value="">No preference</option>
            {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 170px' }}>
          <label className="field-label" htmlFor="q-budget">
            Budget <span className="field-optional">(optional)</span>
          </label>
          <select id="q-budget" className="field-input" value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">Not sure yet</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="q-repo">
          Can you give us scoped repo access so we can implement the fixes?
        </label>
        <select id="q-repo" className="field-input" value={repoAccess} onChange={(e) => setRepoAccess(e.target.value)}>
          <option value="">Not sure</option>
          <option value="yes">Yes — we can arrange that</option>
          <option value="maybe">Maybe, tell me more first</option>
          <option value="no">No — send us the changes to apply ourselves</option>
        </select>
        <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
          We only ever ask for scoped, revocable access and we deliver changes as a pull request you approve.
          We never ask for credentials, API keys or production secrets.
        </p>
      </div>

      {/* Honeypot — hidden from real users */}
      <input
        type="text" tabIndex={-1} autoComplete="off" value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />

      {status === 'error' && <p style={{ margin: 0, fontSize: 14, color: 'var(--error)' }}>{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
        {status === 'sending' ? <span className="spinner" style={{ marginRight: 8 }} /> : null}
        {status === 'sending' ? 'Sending…' : 'Get my price'}
      </button>

      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-dim)' }}>{NO_GUARANTEE.headline}</strong> {NO_GUARANTEE.body}
      </p>
    </form>
  );
}
