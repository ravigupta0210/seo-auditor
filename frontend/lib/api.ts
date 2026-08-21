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

export type QuoteTier = 'report' | 'implementation' | 'analytics' | 'monitoring' | 'custom';

export interface QuoteInput {
  name?: string;
  email: string;
  company?: string;
  siteUrl: string;
  auditId?: string;
  tier?: QuoteTier;
  stack?: string;
  requirements: string;
  timeline?: string;
  budget?: string;
  repoAccess?: 'yes' | 'no' | 'maybe';
  website?: string;
}

/**
 * Submit a paid-work enquiry. This is the revenue funnel — it notifies the owner
 * and sends the prospect an acknowledgement.
 */
export async function submitQuote(input: QuoteInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/quotes`, {
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
  if (score >= 90) return { letter: 'A', color: '#34d399' };
  if (score >= 75) return { letter: 'B', color: '#6ee7b7' };
  if (score >= 60) return { letter: 'C', color: '#fbbf24' };
  if (score >= 40) return { letter: 'D', color: '#fb923c' };
  return { letter: 'F', color: '#f87171' };
}

export function sevColor(sev: Check['severity']): string {
  if (sev === 'error') return '#f87171';
  if (sev === 'warning') return '#fbbf24';
  if (sev === 'info') return '#38bdf8';
  return '#34d399';
}
