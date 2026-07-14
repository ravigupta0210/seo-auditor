'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.6" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.6" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * Compact "Copy link" button. Copies the given URL (falls back to the current
 * page URL) and flips to a "Copied!" confirmation for a moment.
 */
export function CopyLinkButton({
  url,
  label = 'Copy link',
  ariaLabel = 'Copy link to this report',
  trackMethod = 'copy_top',
}: {
  url?: string;
  label?: string;
  ariaLabel?: string;
  trackMethod?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const target = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      track('report_shared', { method: trackMethod });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="btn btn-secondary"
      aria-label={ariaLabel}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', fontSize: 13 }}
    >
      <span style={{ display: 'inline-flex', color: copied ? 'var(--pass)' : 'inherit' }}>
        {copied ? <CheckIcon /> : <LinkIcon />}
      </span>
      {copied ? 'Copied!' : label}
    </button>
  );
}
