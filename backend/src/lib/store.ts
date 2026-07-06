import { randomUUID } from 'node:crypto';
import type { CheckResult } from '../types/check.js';
import { pool } from './db.js';
import { logger } from './logger.js';

export interface SiteSummary {
  overall: number;
  totals: { error: number; warning: number; info: number; pass: number };
  byCategory: Record<string, { score: number; checks: number }>;
}

export interface PageReport {
  url: string;
  status: number;
  bytes: number;
  checks: CheckResult[];
}

export interface AuditReport {
  id: string;
  url: string;
  scope: 'single' | 'site';
  createdAt: string;
  finishedAt?: string;
  summary: SiteSummary;
  pages: PageReport[];
  siteChecks: CheckResult[];
  meta: {
    pagesAnalyzed: number;
    durationMs: number;
    ruleVersion: string;
  };
}

interface StoredReport extends AuditReport {
  expiresAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_REPORTS = 500;
const memory = new Map<string, StoredReport>();

export interface ReportStore {
  save(report: AuditReport): Promise<string>;
  get(id: string): Promise<AuditReport | null>;
  list(limit?: number): Promise<AuditReport[]>;
}

class InMemoryStore implements ReportStore {
  async save(report: AuditReport): Promise<string> {
    const id = report.id || randomUUID();
    memory.set(id, { ...report, id, expiresAt: Date.now() + TTL_MS });

    if (memory.size > MAX_REPORTS) {
      const sorted = [...memory.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      for (let i = 0; i < memory.size - MAX_REPORTS; i++) {
        memory.delete(sorted[i]![0]);
      }
    }
    return id;
  }

  async get(id: string): Promise<AuditReport | null> {
    const r = memory.get(id);
    if (!r) return null;
    if (r.expiresAt < Date.now()) {
      memory.delete(id);
      return null;
    }
    const { expiresAt: _e, ...rest } = r;
    return rest;
  }

  async list(limit = 20): Promise<AuditReport[]> {
    const all = [...memory.values()]
      .filter((r) => r.expiresAt > Date.now())
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, limit);
    return all.map(({ expiresAt: _e, ...rest }) => rest);
  }
}

/**
 * Persistent store backed by Postgres. Stores the full AuditReport as jsonb
 * (for later analysis of what users audit) plus a few extracted columns for
 * cheap querying. No TTL — persistence is the whole point.
 */
class PostgresStore implements ReportStore {
  async save(report: AuditReport): Promise<string> {
    const id = report.id || randomUUID();
    const r = { ...report, id };
    try {
      await pool!.query(
        `INSERT INTO audits
           (id, url, scope, overall_score, pages_analyzed, duration_ms, rule_version, report, created_at, finished_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           overall_score = EXCLUDED.overall_score,
           pages_analyzed = EXCLUDED.pages_analyzed,
           duration_ms = EXCLUDED.duration_ms,
           rule_version = EXCLUDED.rule_version,
           report = EXCLUDED.report,
           finished_at = EXCLUDED.finished_at`,
        [
          id,
          r.url,
          r.scope,
          r.summary?.overall ?? null,
          r.meta?.pagesAnalyzed ?? null,
          r.meta?.durationMs ?? null,
          r.meta?.ruleVersion ?? null,
          JSON.stringify(r),
          r.createdAt,
          r.finishedAt ?? null,
        ],
      );
    } catch (err) {
      // Never let a persistence failure break an audit — fall back to memory.
      logger.error({ err, id }, 'PostgresStore.save failed; caching in memory');
      memory.set(id, { ...r, expiresAt: Date.now() + TTL_MS });
    }
    return id;
  }

  async get(id: string): Promise<AuditReport | null> {
    try {
      const res = await pool!.query<{ report: AuditReport }>('SELECT report FROM audits WHERE id = $1', [id]);
      if (res.rows[0]?.report) return res.rows[0].report;
    } catch (err) {
      logger.error({ err, id }, 'PostgresStore.get failed');
    }
    const cached = memory.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      const { expiresAt: _e, ...rest } = cached;
      return rest;
    }
    return null;
  }

  async list(limit = 20): Promise<AuditReport[]> {
    try {
      const res = await pool!.query<{ report: AuditReport }>(
        'SELECT report FROM audits ORDER BY created_at DESC LIMIT $1',
        [Math.min(limit, 100)],
      );
      return res.rows.map((row) => row.report);
    } catch (err) {
      logger.error({ err }, 'PostgresStore.list failed');
      return [];
    }
  }
}

export const store: ReportStore = pool ? new PostgresStore() : new InMemoryStore();
logger.info({ backend: pool ? 'postgres' : 'in-memory' }, 'report store initialized');
