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
          <span className="tag" style={{ marginBottom: 12 }}>We&apos;d love to hear from you</span>
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
