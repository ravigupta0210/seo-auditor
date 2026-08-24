'use client';

import { useState } from 'react';
import { SITE_URL } from '@/lib/seo';
import { track } from '@/lib/analytics';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" />
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
 *
 * The menu is Radix's DropdownMenu rather than a hand-rolled popover: it brings
 * arrow-key roving focus, type-ahead, focus return to the trigger on close and
 * correct `aria-expanded`/`aria-controls` wiring, none of which the previous
 * click-outside listener had.
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

  // Canonical report link when we have an id; otherwise the current page.
  const shareUrl = reportId
    ? `${SITE_URL}/audit/${reportId}`
    : (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const shareText = `${host} scored ${score}/100 on this free SEO + AI-search (GEO) audit. Check your site's score:`;
  const shareTitle = `SEO + AI-search audit of ${host}`;

  /**
   * Whether to offer the OS share sheet: touch devices only. On desktop
   * `navigator.share` is unreliable or invisible, so we always use the menu.
   * Checked synchronously so the desktop path never touches the pointer event.
   */
  function prefersNativeShare() {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  /** `true` means the OS sheet handled it and the menu should stay shut. */
  async function tryNativeShare() {
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      track('report_shared', { method: 'native', host, score });
      return true;
    } catch {
      return false; // cancelled or unsupported — show the menu instead
    }
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          onPointerDown={(e) => {
            // Desktop: leave the event completely alone so Radix's own trigger
            // handler runs and the button keeps its native focus behaviour.
            if (open || !prefersNativeShare()) return;
            // Touch: Radix opens on pointerdown, so suppress its handler
            // (composeEventHandlers skips it once defaultPrevented) and give the
            // OS sheet the user gesture it requires. Fall back to the menu if
            // the sheet is dismissed.
            e.preventDefault();
            void tryNativeShare().then((handled) => {
              if (!handled) setOpen(true);
            });
          }}
        >
          <ShareIcon />
          Share result
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[210px]">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault(); // keep the menu open so "Link copied!" is visible
            void copyLink();
          }}
        >
          <span style={{ display: 'inline-flex', color: copied ? 'var(--pass)' : 'var(--text-dim)' }}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </span>
          {copied ? 'Link copied!' : 'Copy link'}
        </DropdownMenuItem>
        {intents.map((it) => (
          <DropdownMenuItem key={it.key} asChild>
            <a
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text)' }}
              onClick={() => track('report_shared', { method: it.key, host, score })}
            >
              {/* Icon slot on every row, so the four labels share one left edge. */}
              <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                <ExternalIcon />
              </span>
              {it.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
