'use client';

import { useEffect, useRef, useState } from 'react';
import { SITE_URL } from '@/lib/seo';
import { track } from '@/lib/analytics';

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * Share the audit report. Uses the native share sheet where available (mobile),
 * and falls back to a small menu (Copy link + X / LinkedIn / WhatsApp) on desktop.
 * Every path fires a `report_shared` event so we can see which channels spread.
 */
export function ShareButton({
  reportId,
  host,
  score,
  variant = 'secondary',
}: {
  reportId?: string;
  host: string;
  score: number;
  variant?: 'primary' | 'secondary';
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Canonical report link when we have an id; otherwise the current page.
  const shareUrl = reportId
    ? `${SITE_URL}/audit/${reportId}`
    : (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const shareText = `${host} scored ${score}/100 on this free SEO + AI-search (GEO) audit. Check your site's score:`;
  const shareTitle = `SEO + AI-search audit of ${host}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onClick() {
    // Native share sheet (mobile + some desktop browsers).
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        track('report_shared', { method: 'native', host, score });
        return;
      } catch {
        /* user cancelled or share unsupported — fall through to menu */
      }
    }
    setOpen((o) => !o);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track('report_shared', { method: 'copy', host, score });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  const intents: Array<{ key: string; label: string; href: string }> = [
    {
      key: 'x',
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      key: 'linkedin',
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      key: 'whatsapp',
      label: 'Share on WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
  ];

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={onClick}
        className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <ShareIcon />
        Share result
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 40,
            minWidth: 210,
            padding: 6,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong, var(--border))',
            borderRadius: 'var(--radius, 12px)',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <button type="button" role="menuitem" onClick={copyLink} style={menuItemStyle}>
            <span style={{ display: 'inline-flex', color: copied ? 'var(--pass)' : 'var(--text-dim)' }}>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </span>
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
          {intents.map((it) => (
            <a
              key={it.key}
              role="menuitem"
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('report_shared', { method: it.key, host, score });
                setOpen(false);
              }}
              style={menuItemStyle}
            >
              {it.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  textAlign: 'left',
  padding: '9px 12px',
  fontSize: 13.5,
  color: 'var(--text)',
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  textDecoration: 'none',
};
