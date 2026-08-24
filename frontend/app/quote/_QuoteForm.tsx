'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { submitQuote, type QuoteTier } from '@/lib/api';
import { QUOTE_TIER_OPTIONS, NO_GUARANTEE } from '@/lib/services';
import { track } from '@/lib/analytics';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const TIMELINES = ['As soon as possible', 'Within 2 weeks', 'This month', 'Just exploring'];
const BUDGETS = ['Under $250', '$250 – $750', '$750 – $1,500', '$1,500 – $3,000', '$3,000+'];

const REPO_ACCESS = [
  { value: 'yes', label: 'Yes — we can arrange that' },
  { value: 'maybe', label: 'Maybe, tell me more first' },
  { value: 'no', label: 'No — send us the changes to apply ourselves' },
];

/**
 * Radix's Select rejects an empty-string item value (it reserves "" for the
 * placeholder state), so the "no answer" option needs a sentinel that never
 * reaches the API.
 */
const NONE = '__none';

/** Optional single-choice field. Renders the "no answer" row as a real option. */
function OptionalSelect({
  id, value, onChange, placeholder, noneLabel, options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  noneLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger id={id} className="mt-[7px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>
          <span className="text-[var(--text-muted)]">{noneLabel}</span>
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Optional() {
  return <span className="field-optional">(optional)</span>;
}

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
        <Label htmlFor="q-site">Which site is this for?</Label>
        <Input
          id="q-site" required className="mt-[7px]" value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="yourdomain.com" maxLength={2048} autoComplete="url"
        />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <Label htmlFor="q-email">Email</Label>
          <Input
            id="q-email" type="email" required className="mt-[7px]" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" maxLength={254} autoComplete="email"
          />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <Label htmlFor="q-name">Name <Optional /></Label>
          <Input id="q-name" className="mt-[7px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} autoComplete="name" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <Label htmlFor="q-company">Company <Optional /></Label>
          <Input id="q-company" className="mt-[7px]" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc" maxLength={160} autoComplete="organization" />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <Label htmlFor="q-stack">Tech stack <Optional /></Label>
          <Input id="q-stack" className="mt-[7px]" value={stack} onChange={(e) => setStack(e.target.value)} placeholder="Next.js, Webflow, WordPress…" maxLength={300} />
        </div>
      </div>

      <div>
        <Label htmlFor="q-tier">What are you after?</Label>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger id="q-tier" className="mt-[7px]">
            <SelectValue placeholder="Choose one…" />
          </SelectTrigger>
          <SelectContent>
            {QUOTE_TIER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="q-req">What do you need done?</Label>
        <Textarea
          id="q-req" required className="mt-[7px]" value={requirements}
          onChange={(e) => {
            setRequirements(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Tell us what's going on — what you've already tried, what matters most, and anything unusual about the site. The more detail, the more accurate the price."
          rows={6} maxLength={5000}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 170px', minWidth: 0 }}>
          <Label htmlFor="q-timeline">Timeline <Optional /></Label>
          <OptionalSelect
            id="q-timeline" value={timeline} onChange={setTimeline}
            placeholder="No preference" noneLabel="No preference"
            options={TIMELINES.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <div style={{ flex: '1 1 170px', minWidth: 0 }}>
          <Label htmlFor="q-budget">Budget <Optional /></Label>
          <OptionalSelect
            id="q-budget" value={budget} onChange={setBudget}
            placeholder="Not sure yet" noneLabel="Not sure yet"
            options={BUDGETS.map((b) => ({ value: b, label: b }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="q-repo">
          Can you give us scoped repo access so we can implement the fixes?
        </Label>
        <OptionalSelect
          id="q-repo" value={repoAccess} onChange={setRepoAccess}
          placeholder="Not sure" noneLabel="Not sure"
          options={REPO_ACCESS}
        />
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
