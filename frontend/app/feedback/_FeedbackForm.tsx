'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { submitFeedback } from '@/lib/api';
import { track } from '@/lib/analytics';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function FeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isHelp, setIsHelp] = useState(false);

  // If the visitor arrived from the /help "get help" CTAs (?topic=help), tailor
  // the form so it reads as a help request (and is easy to spot in the admin).
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('topic') === 'help') {
        setIsHelp(true);
        setMessage((m) => m || 'I\'d like help with my site. Here\'s the URL and what I need:\n\n');
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 3) {
      setStatus('error');
      setError('Please write a bit more so we can help.');
      return;
    }
    setStatus('sending');
    setError('');
    const res = await submitFeedback({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      message: message.trim(),
      website,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
    if (res.ok) {
      track(isHelp ? 'help_requested' : 'feedback_submitted', { hasEmail: Boolean(email.trim()) });
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
        <h2 style={{ margin: '0 0 8px', fontSize: 23, letterSpacing: '-0.02em' }}>Thanks for the feedback!</h2>
        <p style={{ margin: '0 auto 22px', maxWidth: 380, color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.6 }}>
          It landed in our inbox and we read every message. We&apos;ll get back to you if you left an email.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to the audit tool
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass-card" style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label className="field-label" htmlFor="fb-name">
            Name <span className="field-optional">(optional)</span>
          </label>
          <input id="fb-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label className="field-label" htmlFor="fb-email">
            Email <span className="field-optional">(optional)</span>
          </label>
          <input id="fb-email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="fb-message">Your feedback</label>
        <textarea
          id="fb-message"
          required
          className="field-input"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Found a bug? Missing a check? Have an idea? Tell us anything…"
          rows={6}
          maxLength={5000}
        />
      </div>

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />

      {status === 'error' && <p style={{ margin: 0, fontSize: 14, color: 'var(--error)' }}>{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
        {status === 'sending' ? <span className="spinner" style={{ marginRight: 8 }} /> : null}
        {status === 'sending' ? 'Sending…' : isHelp ? 'Request help' : 'Send feedback'}
      </button>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        We read every message. Leave an email if you&apos;d like a reply.
      </p>
    </form>
  );
}
