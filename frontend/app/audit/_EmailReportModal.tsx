'use client';

import { useEffect, useState } from 'react';
import { submitLead } from '@/lib/api';

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
    // Show shortly after the report lands, unless already handled this audit.
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
          ? `Sent! Your report is on its way to ${email}.`
          : `Thanks! We've saved your email and will send your report shortly.`,
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
    <div
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Email me this report"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{ position: 'relative', width: '100%', maxWidth: 420, padding: '28px 26px 26px', animation: 'fadeSlideUp 0.25s ease' }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 19 }}>You're all set</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{message}</p>
            <button
              onClick={dismiss}
              className="btn"
              style={{ marginTop: 18 }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📩</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, letterSpacing: '-0.01em' }}>
              Want this report in your inbox?
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              You&apos;ll lose these results when you close this tab. Enter your email and we&apos;ll send the
              full report — no account needed. It&apos;s optional; close this if you&apos;d rather not.
            </p>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 15,
                }}
              />
              {status === 'error' && (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--error)' }}>{message}</p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'sending'}
                style={{ justifyContent: 'center', opacity: status === 'sending' ? 0.7 : 1 }}
              >
                {status === 'sending' ? <span className="spinner" /> : null}
                {status === 'sending' ? 'Sending…' : 'Email me the report'}
              </button>
            </form>
            <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              We&apos;ll only use it to send this report. No spam.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
