import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuditView } from './_view';

export const metadata: Metadata = {
  title: 'Audit in progress',
  robots: { index: false },
};

export default function AuditPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40 }}>Loading audit…</main>}>
      <AuditView />
    </Suspense>
  );
}
