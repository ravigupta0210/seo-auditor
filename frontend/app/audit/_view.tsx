'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCard, type Check } from './_CheckCard';
import { ScoreRing } from '../_components/ScoreRing';
import { SiteHeader } from '../_components/SiteHeader';
import { SiteFooter } from '../_components/SiteFooter';
import { EmailReportModal } from './_EmailReportModal';
import { ConversionCTA } from './_ConversionCTA';
import { ShareButton } from '../_components/ShareButton';
import { track } from '@/lib/analytics';

interface Summary {
  overall: number;
  byCategory: Record<string, { score: number; checks: number }>;
  totals: { error: number; warning: number; info: number; pass: number };
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'running'; message: string }
  | { kind: 'done'; summary: Summary; auditId: string }
  | { kind: 'error'; message: string };

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export function AuditView() {
  const params = useSearchParams();
  const url = params.get('url') ?? '';
  const scope = (params.get('scope') ?? 'single') === 'site' ? 'site' : 'single';
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [checks, setChecks] = useState<Check[]>([]);
  const [crawled, setCrawled] = useState<Array<{ url: string; status: number; depth: number }>>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;
    setPhase({ kind: 'starting' });
    setChecks([]);
    setCrawled([]);
    track('audit_started', { url, scope });

    const endpoint =
      scope === 'site'
        ? `${BACKEND}/api/audit/site/stream?url=${encodeURIComponent(url)}&maxPages=25&maxDepth=2`
        : `${BACKEND}/api/audit/stream?url=${encodeURIComponent(url)}`;

    const es = new EventSource(endpoint);
    esRef.current = es;

    es.addEventListener('start', () => setPhase({ kind: 'running', message: 'Connecting…' }));
    es.addEventListener('phase', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { phase: string; message: string };
      setPhase({ kind: 'running', message: data.message });
    });
    es.addEventListener('crawled', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { url: string; status: number; depth: number };
      setCrawled((prev) => [...prev, data]);
    });
    es.addEventListener('check', (e: MessageEvent) => {
      const check = JSON.parse(e.data) as Check;
      setChecks((prev) => [...prev, check]);
    });
    es.addEventListener('done', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { summary: Summary; auditId: string };
      setPhase({ kind: 'done', summary: data.summary, auditId: data.auditId });
      track('audit_completed', { url, scope, score: data.summary?.overall });
      es.close();
    });
    es.addEventListener('error', (e) => {
      const data = (e as MessageEvent).data;
      if (data) {
        try {
          const parsed = JSON.parse(data) as { message: string };
          setPhase({ kind: 'error', message: parsed.message });
        } catch {
          setPhase({ kind: 'error', message: 'Audit failed.' });
        }
      } else if (es.readyState === EventSource.CLOSED) {
        setPhase((p) => (p.kind === 'done' ? p : { kind: 'error', message: 'Connection closed.' }));
      }
      es.close();
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [url, scope]);

  const sortedChecks = useMemo(() => groupChecks(checks), [checks]);
  const host = useMemo(() => safeHost(url), [url]);

  if (!url) {
    return (
      <>
        <SiteHeader />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: 40 }}>
          <p>No URL provided. <Link href="/">Go home</Link>.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 60px' }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← New audit</Link>

        <header style={{ margin: '20px 0 28px' }}>
          <span className="tag" style={{ marginBottom: 12 }}>
            {phase.kind === 'running' && <span className="spinner" />}
            {scope === 'site' ? 'Full-site crawl' : 'Single-page audit'}
          </span>
          <h1 style={{ fontSize: 'clamp(22px, 6vw, 30px)', margin: '0 0 6px', wordBreak: 'break-word', letterSpacing: '-0.02em' }}>{host}</h1>
          <a href={url} target="_blank" rel="noopener" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{url} ↗</a>
        </header>

        <StatusLine phase={phase} crawled={crawled.length} checkCount={checks.length} />

        {phase.kind === 'done' && (
          <>
            <SummaryBar summary={phase.summary} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <ShareButton reportId={phase.auditId} host={host} score={phase.summary.overall} variant="primary" />
              <Link href={`/audit/${phase.auditId}`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" />
                </svg>
                Download PDF / white-label report →
              </Link>
            </div>
            <ConversionCTA summary={phase.summary} url={url} auditId={phase.auditId} />
          </>
        )}

        {phase.kind === 'error' && (
          <div
            style={{
              padding: '18px 22px',
              background: 'linear-gradient(180deg, rgba(255,107,107,0.08), rgba(255,107,107,0.02))',
              border: '1px solid rgba(255,107,107,0.35)',
              borderRadius: 'var(--radius)',
              marginBottom: 22,
              boxShadow: '0 0 0 1px rgba(255,107,107,0.05), 0 20px 60px -30px rgba(255,107,107,0.3)',
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--error)', fontWeight: 700, marginBottom: 8 }}>
              Audit failed
            </div>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>{phase.message}</p>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Common causes: the site refuses our bot, the URL is private/localhost (we block SSRF), or the site is down.{' '}
              <Link href="/">Try a different URL →</Link>
            </p>
          </div>
        )}

        {scope === 'site' && crawled.length > 0 && (
          <details className="glass-card" style={{ marginBottom: 18, padding: '12px 16px' }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-dim)' }}>
              <strong style={{ color: 'var(--text)' }}>{crawled.length}</strong>{' '}
              {crawled.length === 1 ? 'page' : 'pages'} crawled
            </summary>
            <ul style={{ listStyle: 'none', padding: '10px 0 0', margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              {crawled.map((c, i) => (
                <li key={i} style={{ padding: '3px 0', display: 'flex', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--mono)', color: c.status < 300 ? 'var(--pass)' : c.status < 400 ? 'var(--warning)' : 'var(--error)' }}>
                    {c.status}
                  </span>
                  <span style={{ wordBreak: 'break-all' }}>{c.url}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedChecks.map((c, i) => (
            <CheckCard
              key={`${c.id}-${i}`}
              check={c}
              index={i}
              auditId={phase.kind === 'done' ? phase.auditId : undefined}
              siteUrl={url}
            />
          ))}
        </section>

        {phase.kind === 'running' && checks.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Waiting for first results…</p>
          </div>
        )}
      </main>

      <SiteFooter />

      {phase.kind === 'done' && <EmailReportModal auditId={phase.auditId} url={url} />}
    </>
  );
}

function safeHost(url: string): string {
  try { return new URL(url).host || url; } catch { return url; }
}

function StatusLine({ phase, crawled, checkCount }: { phase: Phase; crawled: number; checkCount: number }) {
  if (phase.kind === 'error' || phase.kind === 'idle') return null;
  if (phase.kind === 'done') return null; // SummaryBar replaces the status line on done

  const parts: string[] = [];
  if (phase.kind === 'running') parts.push(phase.message);
  if (phase.kind === 'starting') parts.push('Starting…');
  if (crawled > 0) parts.push(`${crawled} ${crawled === 1 ? 'page' : 'pages'} crawled`);
  if (checkCount > 0) parts.push(`${checkCount} ${checkCount === 1 ? 'check' : 'checks'}`);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 18, fontSize: 13 }}>
      <span className="spinner" />
      <span style={{ color: 'var(--text-dim)' }}>{parts.join(' · ')}</span>
    </div>
  );
}

function SummaryBar({ summary }: { summary: Summary }) {
  return (
    <div className="glass-card" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '20px 24px',
      marginBottom: 18,
      flexWrap: 'wrap',
    }}>
      <ScoreRing score={summary.overall} size={110} />
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {(['error', 'warning', 'info', 'pass'] as const).map((s) => (
          <Pill key={s} label={s} count={summary.totals[s]} sev={s} />
        ))}
      </div>
    </div>
  );
}

function Pill({ label, count, sev }: { label: string; count: number; sev: 'error' | 'warning' | 'info' | 'pass' }) {
  const color = `var(--${sev})`;
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{count}</div>
    </div>
  );
}

function groupChecks(checks: Check[]): Check[] {
  const byId = new Map<string, Check>();
  for (const c of checks) {
    const existing = byId.get(c.id);
    if (!existing) {
      byId.set(c.id, { ...c, affectedPages: c.pageUrl ? [c.pageUrl] : [] });
    } else if (c.pageUrl && !existing.affectedPages?.includes(c.pageUrl)) {
      existing.affectedPages = [...(existing.affectedPages ?? []), c.pageUrl];
    }
  }
  const sevOrder = { error: 0, warning: 1, info: 2, pass: 3 } as const;
  return [...byId.values()].sort((a, b) => {
    const s = sevOrder[a.severity] - sevOrder[b.severity];
    if (s !== 0) return s;
    return b.priority - a.priority;
  });
}
