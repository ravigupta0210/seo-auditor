'use client';

import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/lib/api';

interface Stats {
  totals: {
    audits_run: number;
    emails_captured: number;
    unique_emails: number;
    report_emails_sent: number;
    emails_sent_total: number;
    feedback_received: number;
  };
  auditsOverTime: Array<{ day: string; n: number }>;
  recentFeedback: Array<{ created_at: string; name: string | null; email: string | null; message: string; url: string | null }>;
  recentLeads: Array<{ created_at: string; email: string; url: string | null; report_sent: boolean }>;
  topUrls: Array<{ url: string; n: number; avg_score: number | null }>;
  recentAudits: Array<{ created_at: string; url: string; scope: string; overall_score: number | null }>;
  sentEmails: Array<{ created_at: string; to_email: string; kind: string; subject: string | null; success: boolean }>;
  generatedAt: string;
}

const fmt = (s: string) => {
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s;
  }
};

export function AdminDashboard() {
  const [key, setKey] = useState('');
  const [data, setData] = useState<Stats | null>(null);
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
      void load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(k: string) {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats?key=${encodeURIComponent(k)}`, { cache: 'no-store' });
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
          if (key.trim()) void load(key.trim());
        }}
        className="glass-card"
        style={{ maxWidth: 420, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <label className="field-label" htmlFor="admin-key">Admin key</label>
          <input
            id="admin-key"
            type="password"
            className="field-input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Your ADMIN_TOKEN"
            autoFocus
          />
        </div>
        {status === 'error' && <p style={{ margin: 0, fontSize: 13.5, color: 'var(--error)' }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={status === 'loading'}>
          {status === 'loading' ? <span className="spinner" style={{ marginRight: 8 }} /> : null}
          {status === 'loading' ? 'Loading…' : 'View dashboard'}
        </button>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          This is the <code>ADMIN_TOKEN</code> you set on the backend. Only you can see this data.
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
  const exportHref = (type: string) => `${BACKEND_URL}/api/stats/export?key=${encodeURIComponent(key)}&type=${type}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>Updated {fmt(data.generatedAt)}</p>
        <button className="btn btn-secondary" onClick={() => void load(key)} style={{ height: 34, fontSize: 13 }}>
          ↻ Refresh
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} className="glass-card" style={{ padding: '18px 18px' }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--accent)', lineHeight: 1.1 }}>
              {k.value.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: 6 }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <Panel title="Audits — last 30 days">
        <AuditsChart data={data.auditsOverTime} />
      </Panel>

      <section className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Export CSV:</span>
        <a className="btn btn-secondary" href={exportHref('leads')} style={{ height: 34, fontSize: 13 }}>Emails</a>
        <a className="btn btn-secondary" href={exportHref('feedback')} style={{ height: 34, fontSize: 13 }}>Feedback</a>
        <a className="btn btn-secondary" href={exportHref('audits')} style={{ height: 34, fontSize: 13 }}>Audits</a>
      </section>

      <Panel title={`Recent feedback (${data.recentFeedback.length})`}>
        {data.recentFeedback.length === 0 ? (
          <Empty>No feedback yet.</Empty>
        ) : (
          data.recentFeedback.map((f, i) => (
            <div key={i} style={{ padding: '12px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{f.name || 'Anonymous'}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(f.created_at)}</span>
              </div>
              {f.email && <div style={{ fontSize: 12.5, color: 'var(--accent)' }}>{f.email}</div>}
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{f.message}</p>
            </div>
          ))
        )}
      </Panel>

      <Panel title={`Emails captured (${data.recentLeads.length} most recent)`}>
        {data.recentLeads.length === 0 ? (
          <Empty>No emails captured yet.</Empty>
        ) : (
          <Table
            head={['Email', 'Audited URL', 'Report', 'When']}
            rows={data.recentLeads.map((l) => [
              l.email,
              l.url ? shortUrl(l.url) : '—',
              l.report_sent ? '✅ sent' : '—',
              fmt(l.created_at),
            ])}
          />
        )}
      </Panel>

      <Panel title="Most-audited URLs">
        {data.topUrls.length === 0 ? (
          <Empty>No audits yet.</Empty>
        ) : (
          <Table
            head={['URL', 'Audits', 'Avg score']}
            rows={data.topUrls.map((u) => [shortUrl(u.url), String(u.n), u.avg_score == null ? '—' : String(u.avg_score)])}
          />
        )}
      </Panel>

      <Panel title="Recent audits">
        {data.recentAudits.length === 0 ? (
          <Empty>No audits yet.</Empty>
        ) : (
          <Table
            head={['URL', 'Scope', 'Score', 'When']}
            rows={data.recentAudits.map((a) => [
              shortUrl(a.url),
              a.scope,
              a.overall_score == null ? '—' : String(a.overall_score),
              fmt(a.created_at),
            ])}
          />
        )}
      </Panel>

      <Panel title={`Sent emails (${data.sentEmails.length} most recent)`}>
        {data.sentEmails.length === 0 ? (
          <Empty>No emails sent yet.</Empty>
        ) : (
          <Table
            head={['To', 'Type', 'Subject', 'Status', 'When']}
            rows={data.sentEmails.map((e) => [
              e.to_email,
              e.kind,
              e.subject || '—',
              e.success ? '✅ sent' : '⚠️ failed',
              fmt(e.created_at),
            ])}
          />
        )}
      </Panel>
    </div>
  );
}

/** Single-series bar chart: audits per day over the last 30 days. */
function AuditsChart({ data }: { data: Array<{ day: string; n: number }> }) {
  const W = 640;
  const H = 170;
  const padX = 8;
  const padTop = 10;
  const axisH = 22;
  const plotH = H - padTop - axisH;
  const innerW = W - padX * 2;
  const slot = innerW / Math.max(data.length, 1);
  const barW = Math.max(4, slot - 3);
  const max = Math.max(1, ...data.map((d) => d.n));
  const baseline = padTop + plotH;
  const total = data.reduce((s, d) => s + d.n, 0);

  if (total === 0) {
    return <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>No audits in the last 30 days yet.</p>;
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
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Audits per day, last 30 days" style={{ display: 'block', minWidth: 320 }}>
          {/* recessive baseline */}
          <line x1={padX} y1={baseline} x2={W - padX} y2={baseline} stroke="var(--border)" strokeWidth="1" />
          {data.map((d, i) => {
            const x = padX + i * slot + (slot - barW) / 2;
            const h = (d.n / max) * plotH;
            const y = baseline - h;
            return (
              <g key={d.day}>
                <rect x={x} y={y} width={barW} height={h} rx={2.5} fill="var(--accent)" opacity={d.n ? 0.92 : 0} />
                {/* full-slot transparent hit target for hover */}
                <rect x={padX + i * slot} y={padTop} width={slot} height={plotH} fill="transparent">
                  <title>{`${d.day}: ${d.n} audit${d.n === 1 ? '' : 's'}`}</title>
                </rect>
              </g>
            );
          })}
          {/* first / mid / last date ticks */}
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

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px 6px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: '8px 10px 8px 0', borderTop: '1px solid var(--border)', color: j === 0 ? 'var(--text)' : 'var(--text-dim)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: j === 0 ? 'normal' : 'nowrap', wordBreak: j === 0 ? 'break-all' : 'normal' }}>
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

function shortUrl(u: string): string {
  return u.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
