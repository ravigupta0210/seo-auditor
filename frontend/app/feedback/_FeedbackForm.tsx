'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitFeedback } from '@/lib/api';

export function FeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

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
      setStatus('done');
    } else {
      setStatus('error');
      setError(res.error || 'Something went wrong. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <div className="glass-card" style={{ padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🙏</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Thanks for the feedback!</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 15 }}>
          It landed in our inbox and we read every message. We&apos;ll get back to you if you left an email.
        </p>
        <Link href="/" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          Back to the audit tool
        </Link>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 15,
    fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-dim)',
    marginBottom: 6,
  };

  return (
    <form onSubmit={onSubmit} className="glass-card" style={{ padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={labelStyle} htmlFor="fb-name">Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input id="fb-name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={labelStyle} htmlFor="fb-email">Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input id="fb-email" type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="fb-message">Your feedback</label>
        <textarea
          id="fb-message"
          required
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Found a bug? Missing a check? Have an idea? Tell us anything…"
          rows={6}
          maxLength={5000}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
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

      <button
        type="submit"
        className="btn btn-primary"
        disabled={status === 'sending'}
        style={{ justifyContent: 'center', opacity: status === 'sending' ? 0.7 : 1 }}
      >
        {status === 'sending' ? <span className="spinner" /> : null}
        {status === 'sending' ? 'Sending…' : 'Send feedback'}
      </button>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        We read every message. Leave an email if you&apos;d like a reply.
      </p>
    </form>
  );
}
