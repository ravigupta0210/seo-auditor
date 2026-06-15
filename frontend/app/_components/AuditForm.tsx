'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuditForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [scope, setScope] = useState<'single' | 'site'>('single');
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let value = url.trim();
    if (!value) return;
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    setSubmitting(true);
    router.push(`/audit?url=${encodeURIComponent(value)}&scope=${scope}`);
  };

  return (
    <div id="top">
      <form
        onSubmit={submit}
        className="audit-form"
        style={{
          display: 'flex',
          gap: 8,
          background: 'var(--bg-card)',
          padding: 6,
          borderRadius: 14,
          border: '1px solid var(--border)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -30px var(--accent-glow)',
        }}
      >
        <input
          type="text"
          inputMode="url"
          placeholder="example.com or https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
          required
          style={{
            flex: 1,
            background: 'transparent',
            color: 'var(--text)',
            border: 'none',
            outline: 'none',
            padding: '12px 16px',
            fontSize: 16,
            fontFamily: 'inherit',
          }}
        />
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <>
              <span className="spinner" style={{ marginRight: 8 }} />
              Auditing
            </>
          ) : (
            <>Audit →</>
          )}
        </button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' }}>
        <ScopeButton active={scope === 'single'} onClick={() => setScope('single')} label="Single page" hint="Deep analysis" />
        <ScopeButton active={scope === 'site'} onClick={() => setScope('site')} label="Full site" hint="Up to 25 pages" />
      </div>
    </div>
  );
}

function ScopeButton({ active, onClick, label, hint }: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'var(--bg-card)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 999,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? 'var(--accent)' : 'var(--text-faint)',
        boxShadow: active ? '0 0 8px var(--accent-glow)' : 'none',
      }} />
      <span>{label}</span>
      <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>· {hint}</span>
    </button>
  );
}
