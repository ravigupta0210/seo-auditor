'use client';

import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/lib/api';

type Row = Record<string, unknown>;
interface Stats {
  days: number;
  totals: {
    audits_run: number;
    emails_captured: number;
    unique_emails: number;
    report_emails_sent: number;
    emails_sent_total: number;
    feedback_received: number;
  };
  auditsOverTime: Array<{ day: string; n: number }>;
  recentFeedback: Row[];
  recentLeads: Row[];
  topUrls: Array<{ url: string; n: number; avg_score: number | null }>;
  recentAudits: Row[];
  sentEmails: Row[];
  generatedAt: string;
}

const fmt = (s: unknown) => {
  try {
    return new Date(String(s)).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(s);
  }
};
const shortUrl = (u: unknown) => String(u ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '') || '—';

interface GscData {
  range: { startDate: string; endDate: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  sitemaps: Array<{ path: string; lastDownloaded: string | null; isPending: boolean; discovered: number; errors: string | null }>;
}
interface PhData {
  days: number;
  visitors: number;
  pageviews: number;
  events: Record<string, number>;
  conversionRate: number;
}
interface Insights {
  gsc: GscData | null;
  gscReason: string | null;
  posthog: PhData | null;
  posthogReason: string | null;
}

export function AdminDashboard() {
  const [key, setKey] = useState('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let saved = '';
    try {
      saved = localStorage.getItem('adminKey') ?? '';
    } catch {
      /* ignore */
    }
    if (saved) {
      setKey(saved);
      void load(saved, 30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(k: string, d: number) {
    setStatus('loading');
    setError('');
    setDays(d);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats?key=${encodeURIComponent(k)}&days=${d}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setError(json.error || `Request failed (${res.status})`);
        setData(null);
        return;
      }
      setData(json as Stats);
      setStatus('idle');
      try {
        localStorage.setItem('adminKey', k);
      } catch {
        /* ignore */
      }
      // Growth insights (GSC + PostHog) — best-effort, never blocks the dashboard.
      try {
        const ir = await fetch(`${BACKEND_URL}/api/insights?key=${encodeURIComponent(k)}&days=${d}`, { cache: 'no-store' });
        setInsights(ir.ok ? ((await ir.json()) as Insights) : null);
      } catch {
        setInsights(null);
      }
    } catch {
      setStatus('error');
      setError('Network error — is the backend awake? (Render free tier cold-starts ~30s.)');
    }
  }

  if (!data) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) void load(key.trim(), 30);
        }}
        className="glass-card"
        style={{ maxWidth: 420, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <label className="field-label" htmlFor="admin-key">Admin key</label>
          <input id="admin-key" type="password" className="field-input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Your ADMIN_TOKEN" autoFocus />
        </div>
        {status === 'error' && <p style={{ margin: 0, fontSize: 13.5, color: 'var(--error)' }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={status === 'loading'}>
          {status === 'loading' ? <span className="spinner" style={{ marginRight: 8 }} /> : null}
          {status === 'loading' ? 'Loading…' : 'View dashboard'}
        </button>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          The <code>ADMIN_TOKEN</code> you set on the backend. Only you can see this data.
        </p>
      </form>
    );
  }

  const t = data.totals;
  const kpis = [
    { label: 'Audits run', value: t.audits_run },
    { label: 'Emails captured', value: t.emails_captured },
    { label: 'Unique emails', value: t.unique_emails },
    { label: 'Reports emailed', value: t.report_emails_sent },
    { label: 'Emails sent (all)', value: t.emails_sent_total },
    { label: 'Feedback received', value: t.feedback_received },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>Updated {fmt(data.generatedAt)}</p>
        <button className="btn btn-secondary" onClick={() => void load(key, days)} style={{ height: 34, fontSize: 13 }}>↻ Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} className="glass-card" style={{ padding: '18px 18px' }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--accent)', lineHeight: 1.1 }}>{k.value.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: 6 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <InsightsSection insights={insights} />

      <section className="glass-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em' }}>Audits over time</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => void load(key, d)}
                className="btn btn-secondary"
                style={{ height: 30, fontSize: 12.5, padding: '0 12px', ...(days === d ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}) }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <AuditsChart data={data.auditsOverTime} />
      </section>

      <DataSection
        title="Feedback"
        type="feedback"
        apiKey={key}
        recent={data.recentFeedback}
        head={['Name', 'Email', 'Message', 'When']}
        renderRow={(f) => [(f.name as string) || 'Anonymous', (f.email as string) || '—', <span key="m" style={{ whiteSpace: 'pre-wrap' }}>{String(f.message)}</span>, fmt(f.created_at)]}
      />

      <DataSection
        title="Emails captured"
        type="leads"
        apiKey={key}
        recent={data.recentLeads}
        head={['Email', 'Audited URL', 'Report', 'When', '']}
        renderRow={(l) => [
          l.email as string,
          shortUrl(l.url),
          l.report_sent ? '✅ sent' : '—',
          fmt(l.created_at),
          <ResendButton key="r" email={String(l.email)} auditId={l.audit_id ? String(l.audit_id) : null} apiKey={key} />,
        ]}
      />

      <Panel title="Most-audited URLs">
        {data.topUrls.length === 0 ? (
          <Empty>No audits yet.</Empty>
        ) : (
          <ScrollTable head={['URL', 'Audits', 'Avg score']} rows={data.topUrls.map((u) => [shortUrl(u.url), String(u.n), u.avg_score == null ? '—' : String(u.avg_score)])} />
        )}
      </Panel>

      <DataSection
        title="Audits"
        type="audits"
        apiKey={key}
        recent={data.recentAudits}
        head={['URL', 'Scope', 'Score', 'When']}
        renderRow={(a) => [shortUrl(a.url), String(a.scope), a.overall_score == null ? '—' : String(a.overall_score), fmt(a.created_at)]}
      />

      <DataSection
        title="Sent emails"
        type="sent"
        apiKey={key}
        recent={data.sentEmails}
        head={['To', 'Type', 'Subject', 'Status', 'When']}
        renderRow={(e) => [e.to_email as string, String(e.kind), (e.subject as string) || '—', e.success ? '✅ sent' : '⚠️ failed', fmt(e.created_at)]}
      />
    </div>
  );
}

/** A panel whose rows can be expanded from "recent" to the full list (in-dashboard, no download). */
function DataSection({
  title,
  type,
  apiKey,
  recent,
  head,
  renderRow,
}: {
  title: string;
  type: string;
  apiKey: string;
  recent: Row[];
  head: string[];
  renderRow: (row: Row) => Array<React.ReactNode>;
}) {
  const [fullRows, setFullRows] = useState<Row[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Re-sync with the freshly fetched "recent" rows whenever the parent reloads.
  useEffect(() => {
    setFullRows(null);
    setExpanded(false);
    setTruncated(false);
  }, [recent]);

  const rows = expanded && fullRows ? fullRows : recent;
  const exportHref = `${BACKEND_URL}/api/stats/export?key=${encodeURIComponent(apiKey)}&type=${type}`;

  async function showAll() {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats/list?key=${encodeURIComponent(apiKey)}&type=${type}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'Failed to load.');
      } else {
        setFullRows(json.rows as Row[]);
        setTruncated(Boolean(json.truncated));
        setExpanded(true);
      }
    } catch {
      setErr('Network error.');
    }
    setLoading(false);
  }

  const count = expanded ? `all ${rows.length}${truncated ? '+' : ''}` : `${recent.length} recent`;

  return (
    <section className="glass-card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em' }}>
          {title} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>({count})</span>
        </h2>
        <a className="btn btn-secondary" href={exportHref} style={{ height: 30, fontSize: 12.5, padding: '0 12px' }}>⬇ Download CSV</a>
      </div>
      {rows.length === 0 ? (
        <Empty>Nothing here yet.</Empty>
      ) : (
        <>
          <ScrollTable head={head} rows={rows.map(renderRow)} />
          {err && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--error)' }}>{err}</p>}
          {!expanded && (
            <button onClick={showAll} className="btn btn-secondary" disabled={loading} style={{ height: 32, fontSize: 12.5, marginTop: 12 }}>
              {loading ? <span className="spinner" style={{ marginRight: 6 }} /> : null}
              {loading ? 'Loading…' : 'Show all in dashboard'}
            </button>
          )}
          {expanded && truncated && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Showing the latest 1,000. Use Download CSV for the complete history.</p>
          )}
        </>
      )}
    </section>
  );
}

function ResendButton({ email, auditId, apiKey }: { email: string; auditId: string | null; apiKey: string }) {
  const [st, setSt] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  if (!auditId) return <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>;
  async function go() {
    setSt('sending');
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats/resend?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, auditId }),
      });
      const j = await res.json().catch(() => ({}));
      setSt(res.ok && j.emailed ? 'done' : 'error');
    } catch {
      setSt('error');
    }
  }
  return (
    <button className="btn btn-secondary" style={{ height: 28, fontSize: 12, padding: '0 10px' }} disabled={st === 'sending' || st === 'done'} onClick={go}>
      {st === 'idle' ? 'Resend' : st === 'sending' ? '…' : st === 'done' ? '✓ Sent' : 'Retry'}
    </button>
  );
}

function MiniTiles({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
      {items.map((it) => (
        <div key={it.label} className="glass-card" style={{ padding: '14px 14px' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {typeof it.value === 'number' ? it.value.toLocaleString() : it.value}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: 4 }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function GscBody({ gsc }: { gsc: GscData }) {
  const t = gsc.totals;
  const hasTraffic = t.clicks > 0 || t.impressions > 0;
  return (
    <>
      <MiniTiles
        items={[
          { label: 'Clicks', value: t.clicks },
          { label: 'Impressions', value: t.impressions },
          { label: 'CTR', value: `${(t.ctr * 100).toFixed(1)}%` },
          { label: 'Avg position', value: t.position ? t.position.toFixed(1) : '—' },
        ]}
      />
      {gsc.sitemaps.length > 0 && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
          Sitemaps:{' '}
          {gsc.sitemaps.map((s) => `${s.path} (${s.discovered} discovered${s.isPending ? ', pending' : ''}${s.errors ? `, ${s.errors} errors` : ''})`).join(' · ')}
        </p>
      )}
      {!hasTraffic ? (
        <Empty>No Search impressions yet — the site is still being indexed. Queries/clicks will fill in as pages get indexed.</Empty>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-dim)' }}>Top queries</h3>
            <ScrollTable head={['Query', 'Clicks', 'Impr', 'Pos']} rows={gsc.topQueries.map((q) => [q.query, String(q.clicks), String(q.impressions), q.position.toFixed(1)])} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-dim)' }}>Top pages</h3>
            <ScrollTable head={['Page', 'Clicks', 'Impr', 'Pos']} rows={gsc.topPages.map((p) => [shortUrl(p.page), String(p.clicks), String(p.impressions), p.position.toFixed(1)])} />
          </div>
        </div>
      )}
    </>
  );
}

function PhBody({ ph }: { ph: PhData }) {
  const ev = ph.events;
  return (
    <>
      <MiniTiles
        items={[
          { label: 'Visitors', value: ph.visitors },
          { label: 'Pageviews', value: ph.pageviews },
          { label: 'Audits started', value: ev.audit_started ?? 0 },
          { label: 'Email conv.', value: `${ph.conversionRate}%` },
        ]}
      />
      <ScrollTable
        head={['Funnel event', 'Count']}
        rows={['audit_started', 'audit_completed', 'email_captured', 'help_requested', 'feedback_submitted'].map((e) => [e, String(ev[e] ?? 0)])}
      />
    </>
  );
}

function InsightsSection({ insights }: { insights: Insights | null }) {
  if (!insights) return null;
  return (
    <>
      <Panel title="Search Console">
        {insights.gsc ? <GscBody gsc={insights.gsc} /> : <Empty>{insights.gscReason ?? 'Not available.'}</Empty>}
      </Panel>
      <Panel title="Analytics (PostHog)">
        {insights.posthog ? <PhBody ph={insights.posthog} /> : <Empty>{insights.posthogReason ?? 'Not available.'}</Empty>}
      </Panel>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card" style={{ padding: '20px 22px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 15, letterSpacing: '-0.01em' }}>{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{children}</p>;
}

function ScrollTable({ head, rows }: { head: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div style={{ maxHeight: 400, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', textAlign: 'left', padding: '6px 10px 8px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: '8px 10px 8px 0', borderTop: '1px solid var(--border)', color: j === 0 ? 'var(--text)' : 'var(--text-dim)', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: j === 0 ? 'normal' : 'nowrap', wordBreak: j === 0 ? 'break-all' : 'normal', verticalAlign: 'top' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Single-series bar chart: audits per day. */
function AuditsChart({ data }: { data: Array<{ day: string; n: number }> }) {
  const W = 640;
  const H = 170;
  const padX = 8;
  const padTop = 10;
  const axisH = 22;
  const plotH = H - padTop - axisH;
  const innerW = W - padX * 2;
  const slot = innerW / Math.max(data.length, 1);
  const barW = Math.max(3, slot - 3);
  const max = Math.max(1, ...data.map((d) => d.n));
  const baseline = padTop + plotH;
  const total = data.reduce((s, d) => s + d.n, 0);

  if (total === 0) {
    return <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>No audits in this period yet.</p>;
  }

  const dm = (day: string) => {
    const [, m, d] = day.split('-');
    return `${Number(m)}/${Number(d)}`;
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
        <strong style={{ color: 'var(--text)' }}>{total.toLocaleString()}</strong> audits · peak {max}/day
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Audits per day" style={{ display: 'block', minWidth: 320 }}>
          <line x1={padX} y1={baseline} x2={W - padX} y2={baseline} stroke="var(--border)" strokeWidth="1" />
          {data.map((d, i) => {
            const x = padX + i * slot + (slot - barW) / 2;
            const h = (d.n / max) * plotH;
            const y = baseline - h;
            return (
              <g key={d.day}>
                {d.n > 0 && <rect x={x} y={y} width={barW} height={h} rx={2.5} fill="var(--accent)" opacity={0.92} />}
                <rect x={padX + i * slot} y={padTop} width={slot} height={plotH} fill="transparent">
                  <title>{`${d.day}: ${d.n} audit${d.n === 1 ? '' : 's'}`}</title>
                </rect>
              </g>
            );
          })}
          {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <text key={i} x={padX + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
              {data[i] ? dm(data[i].day) : ''}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
