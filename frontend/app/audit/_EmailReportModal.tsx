'use client';

import { useEffect, useState } from 'react';
import { submitLead } from '@/lib/api';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7.5 8.5 5.5 8.5-5.5" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/**
 * Post-audit popup: nudges the visitor to get their report by email, because
 * the live results vanish when they close the tab. Fully optional — closes via
 * the ✕, the backdrop, or Esc, and never re-shows for the same audit once
 * dismissed or submitted (tracked in localStorage).
 */
export function EmailReportModal({ auditId, url }: { auditId: string; url: string }) {
  const storageKey = `emailReportDismissed:${auditId}`;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === '1';
    } catch {
      /* ignore */
    }
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [storageKey]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('sending');
    const res = await submitLead({ email, auditId, url });
    if (res.ok) {
      setStatus('done');
      setMessage(
        res.emailed
          ? `Your report is on its way to ${email}.`
          : `We've saved your email and will send your report shortly.`,
      );
      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        /* ignore */
      }
    } else {
      setStatus('error');
      setMessage(res.error || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="modal-backdrop" onClick={dismiss} role="dialog" aria-modal="true" aria-label="Email me this report">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={dismiss} aria-label="Close">
          <CloseIcon />
        </button>

        {status === 'done' ? (
          <div style={{ textAlign: 'center' }}>
            <span className="modal-badge is-success">
              <CheckIcon />
            </span>
            <h2 style={{ margin: '0 0 8px', fontSize: 21, letterSpacing: '-0.02em' }}>You&apos;re all set</h2>
            <p style={{ margin: '0 auto', maxWidth: 320, fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.55 }}>{message}</p>
            <p
              style={{
                margin: '14px auto 0',
                maxWidth: 340,
                fontSize: 12.5,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                background: 'var(--accent-grad-soft)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
              }}
            >
              📬 Don&apos;t see it in a minute? Please <strong style={{ color: 'var(--text-dim)' }}>check your spam folder</strong> — and if it&apos;s there, mark it <strong style={{ color: 'var(--text-dim)' }}>&ldquo;Not spam&rdquo;</strong> so future reports land in your inbox.
            </p>
            <button onClick={dismiss} className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="modal-badge">
              <MailIcon />
            </span>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, letterSpacing: '-0.02em' }}>Want this report in your inbox?</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              These results disappear when you close the tab. Drop your email and we&apos;ll send the full
              report — no account needed.
            </p>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                required
                autoFocus
                className="field-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="you@example.com"
                aria-label="Your email address"
              />
              {status === 'error' && (
                <p style={{ margin: '-2px 0 0', fontSize: 13, color: 'var(--error)' }}>{message}</p>
              )}
              <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
                {status === 'sending' ? <span className="spinner" style={{ marginRight: 8 }} /> : null}
                {status === 'sending' ? 'Sending…' : 'Email me the report'}
              </button>
            </form>
            <p style={{ margin: '14px 0 0', fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center' }}>
              🔒 Only used to send this report. No spam, ever.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
