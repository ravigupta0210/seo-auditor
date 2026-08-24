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
import { categoryLabel } from '@/lib/checks-catalog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  // Passes routinely outnumber problems 4:1 — a clean page can produce 29
  // green cards around 4 real findings. Rendering them in one flat list buries
  // the only part anyone came for, so they are split and the passes collapsed.
  const problems = useMemo(() => sortedChecks.filter((c) => c.severity !== 'pass'), [sortedChecks]);
  const passes = useMemo(() => sortedChecks.filter((c) => c.severity === 'pass'), [sortedChecks]);
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

        <Findings
          // Keyed on the audit being viewed, so starting a new audit drops the
          // previously selected category filter instead of silently applying it
          // to a different site's results.
          key={`${url}|${scope}`}
          problems={problems}
          auditId={phase.kind === 'done' ? phase.auditId : undefined}
          siteUrl={url}
        />

        {phase.kind === 'done' && problems.length === 0 && passes.length > 0 && (
          <div className="audit-allclear">
            <strong>Nothing to fix.</strong> All {passes.length} checks passed — no errors, warnings
            or informational findings on this page.
          </div>
        )}

        {passes.length > 0 && (
          <Accordion type="single" collapsible className="audit-passes">
            <AccordionItem value="passes" className="border-b-0">
              <AccordionTrigger className="audit-passes__summary hover:no-underline">
                <span className="audit-passes__count">{passes.length}</span>
                checks passed
                <span className="audit-passes__hint">— expand to review</span>
              </AccordionTrigger>
              <AccordionContent className="audit-passes__list pb-0">
                {passes.map((c, i) => (
                  <CheckCard
                    key={`${c.id}-${i}`}
                    check={c}
                    index={i}
                    auditId={phase.kind === 'done' ? phase.auditId : undefined}
                    siteUrl={url}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

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

/**
 * What each severity actually costs. Surfaced on hover/focus because the score
 * is the first thing people question — "why 62?" is answerable from here.
 */
const SEVERITY_HELP: Record<'error' | 'warning' | 'info' | 'pass', string> = {
  error: 'Something is broken or missing that search engines and AI crawlers rely on. Costs 12 points each.',
  warning: 'Works, but below best practice — usually a quick win. Costs 4 points each.',
  info: 'Worth knowing about. Rarely urgent. Costs 1 point each.',
  pass: 'Already correct. No action needed, and no effect on your score.',
};

function SummaryBar({ summary }: { summary: Summary }) {
  return (
    <TooltipProvider delayDuration={120}>
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
    </TooltipProvider>
  );
}

function Pill({ label, count, sev }: { label: string; count: number; sev: 'error' | 'warning' | 'info' | 'pass' }) {
  const color = `var(--${sev})`;
  return (
    <Tooltip>
      {/* Spans, not divs: the trigger is a <button>, whose content model is
          phrasing content only. `display: block` gets the same two-line stack. */}
      <TooltipTrigger className="cursor-help text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 rounded-[6px]">
        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, borderBottom: '1px dotted var(--border-strong)', paddingBottom: 1 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{count}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>{SEVERITY_HELP[sev]}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The findings list, filterable by category.
 *
 * A single page routinely returns findings across six or seven categories at
 * once; scanning for "just the JSON-LD problems" meant reading the whole list.
 * The tab strip only appears once there is more than one category to choose
 * between, so a short report is not padded with chrome it does not need.
 */
function Findings({
  problems,
  auditId,
  siteUrl,
}: {
  problems: Check[];
  auditId?: string;
  siteUrl: string;
}) {
  const [cat, setCat] = useState('all');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of problems) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    return [...counts.entries()].map(([id, count]) => ({ id, count }));
  }, [problems]);

  const list = (only: string) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {problems
        .filter((c) => only === 'all' || c.category === only)
        .map((c, i) => (
          <CheckCard key={`${c.id}-${i}`} check={c} index={i} auditId={auditId} siteUrl={siteUrl} />
        ))}
    </section>
  );

  if (problems.length === 0) return null;
  if (categories.length < 2) return list('all');

  // Defensive: never hand Radix a value with no matching trigger/content.
  const active = cat !== 'all' && !categories.some((c) => c.id === cat) ? 'all' : cat;

  return (
    <Tabs value={active} onValueChange={setCat}>
      <TabsList variant="line" className="w-full justify-start overflow-x-auto mb-1">
        <TabsTrigger value="all" className="flex-none">
          All <span className="opacity-60">{problems.length}</span>
        </TabsTrigger>
        {categories.map((c) => (
          <TabsTrigger key={c.id} value={c.id} className="flex-none">
            {categoryLabel(c.id)} <span className="opacity-60">{c.count}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="all">{list('all')}</TabsContent>
      {categories.map((c) => (
        <TabsContent key={c.id} value={c.id}>{list(c.id)}</TabsContent>
      ))}
    </Tabs>
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
