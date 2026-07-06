import type { Metadata } from 'next';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { pageMetadata } from '@/lib/seo';
import { FeedbackForm } from './_FeedbackForm';

export const metadata: Metadata = pageMetadata({
  title: 'Feedback — Free SEO + GEO Audit',
  description:
    'Share feedback, report a bug, or request a feature for the free SEO + GEO audit tool. We read every message.',
  path: '/feedback',
});

export default function FeedbackPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 64px' }}>
        <header style={{ marginBottom: 24 }}>
          <span className="fb-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </span>
          <h1 style={{ fontSize: 'clamp(26px, 6vw, 36px)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Send us feedback
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            This tool is free and built in the open. Found a bug, want a new check, or have an idea to make it
            better? Tell us — every message reaches us directly and shapes what we build next.
          </p>
        </header>

        <FeedbackForm />
      </main>
      <SiteFooter />
    </>
  );
}
