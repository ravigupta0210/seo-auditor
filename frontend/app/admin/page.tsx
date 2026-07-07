import type { Metadata } from 'next';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { pageMetadata } from '@/lib/seo';
import { AdminDashboard } from './_AdminDashboard';

export const metadata: Metadata = pageMetadata({
  title: 'Admin — Free SEO Audit',
  description: 'Owner-only usage dashboard.',
  path: '/admin',
  index: false,
});

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}>
        <header style={{ marginBottom: 24 }}>
          <span className="tag" style={{ marginBottom: 12 }}>Private</span>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Usage dashboard
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-muted)' }}>
            Audits, captured emails, and feedback — visible only with your admin key.
          </p>
        </header>
        <AdminDashboard />
      </main>
      <SiteFooter />
    </>
  );
}
