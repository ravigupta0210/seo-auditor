'use client';

import { useEffect, useState } from 'react';
import { submitLead } from '@/lib/api';
import { track } from '@/lib/analytics';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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

  /**
   * When to interrupt.
   *
   * This used to fire on a 900ms timer, which landed it on top of the score,
   * the share buttons and the primary "get these fixed for me" CTA — before
   * the visitor had even read their result. Capturing an email is worth less
   * than the conversion it was covering.
   *
   * Now it waits for a signal that the visitor is engaged or leaving:
   *   - they scrolled past the findings (they read the result), or
   *   - the pointer left through the top of the viewport (exit intent), or
   *   - 45s of dwell as a backstop.
   * Whichever fires first, and never while the result is still landing.
   */
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === '1';
    } catch {
      /* ignore */
    }
    if (seen) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOpen(true);
      cleanup();
    };

    const onScroll = () => {
      // Roughly "past the summary and into the findings".
      if (window.scrollY > window.innerHeight * 0.9) show();
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };
    const backstop = setTimeout(show, 45_000);

    function cleanup() {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onLeave);
      clearTimeout(backstop);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onLeave);
    return cleanup;
  }, [storageKey]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
  };

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
      track('email_captured', { url, emailed: res.emailed });
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
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      {/*
        Radix supplies the focus trap, scroll lock, Escape handling, backdrop
        dismissal and aria wiring that the hand-rolled version lacked. The
        `.modal-*` classes still carry every pixel of the look; only the
        geometry utilities shadcn injects are neutralised here.
      */}
      <DialogContent
        overlayClassName="modal-backdrop"
        className="modal-card relative block top-auto left-auto translate-x-0 translate-y-0 gap-0"
        showCloseButton={false}
      >
        <DialogClose className="modal-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </DialogClose>

        {status === 'done' ? (
          <div style={{ textAlign: 'center' }}>
            <span className="modal-badge is-success">
              <CheckIcon />
            </span>
            <DialogTitle style={{ margin: '0 0 8px', fontSize: 21, letterSpacing: '-0.02em' }}>You&apos;re all set</DialogTitle>
            <DialogDescription style={{ margin: '0 auto', maxWidth: 320, fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.55 }}>{message}</DialogDescription>
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
            <DialogTitle style={{ margin: '0 0 8px', fontSize: 22, letterSpacing: '-0.02em' }}>Want this report in your inbox?</DialogTitle>
            <DialogDescription style={{ margin: '0 0 20px', fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              These results disappear when you close the tab. Drop your email and we&apos;ll send the full
              report — no account needed.
            </DialogDescription>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                type="email"
                required
                autoFocus
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
      </DialogContent>
    </Dialog>
  );
}
