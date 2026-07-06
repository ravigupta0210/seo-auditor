export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface Check {
  id: string;
  category: string;
  severity: 'error' | 'warning' | 'info' | 'pass';
  title: string;
  evidence?: unknown;
  whyItMatters: string;
  fix: {
    summary: string;
    snippet?: string;
    steps?: string[];
    docLink: string;
  };
  priority: number;
  ruleVersion: string;
}

export interface PageReport {
  url: string;
  status: number;
  bytes: number;
  checks: Check[];
}

export interface AuditReport {
  id: string;
  url: string;
  scope: 'single' | 'site';
  createdAt: string;
  finishedAt?: string;
  summary: {
    overall: number;
    totals: { error: number; warning: number; info: number; pass: number };
    byCategory: Record<string, { score: number; checks: number }>;
  };
  pages: PageReport[];
  siteChecks: Check[];
  meta: { pagesAnalyzed: number; durationMs: number; ruleVersion: string };
}

export interface RecentReport {
  id: string;
  url: string;
  scope: 'single' | 'site';
  createdAt: string;
  finishedAt?: string;
  summary: AuditReport['summary'];
  meta: AuditReport['meta'];
}

export async function getReport(id: string): Promise<AuditReport | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/audit/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as AuditReport;
  } catch {
    return null;
  }
}

export async function listRecentReports(limit = 20): Promise<RecentReport[]> {
  // 3-second timeout — Render free-tier cold starts take 30s+ and we should
  // never block server-side rendering on backend availability.
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 3000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/audit/recent/list?limit=${limit}`, {
      cache: 'no-store',
      signal: ac.signal,
    });
    if (!res.ok) return [];
    return (await res.json()) as RecentReport[];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Capture an email that wants its audit report emailed to them. */
export async function submitLead(input: { email: string; auditId?: string; url?: string }): Promise<{ ok: boolean; emailed?: boolean; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { emailed?: boolean; error?: string };
    if (!res.ok) return { ok: false, error: data.error || 'Something went wrong. Please try again.' };
    return { ok: true, emailed: data.emailed };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

/** Send a feedback message (also emails the site owner). */
export async function submitFeedback(input: { name?: string; email?: string; message: string; url?: string; website?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || 'Something went wrong. Please try again.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

export function grade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: 'A', color: '#4ade80' };
  if (score >= 75) return { letter: 'B', color: '#86efac' };
  if (score >= 60) return { letter: 'C', color: '#ffb347' };
  if (score >= 40) return { letter: 'D', color: '#ff9870' };
  return { letter: 'F', color: '#ff6b6b' };
}

export function sevColor(sev: Check['severity']): string {
  if (sev === 'error') return '#ff6b6b';
  if (sev === 'warning') return '#ffb347';
  if (sev === 'info') return '#57c7ff';
  return '#4ade80';
}
