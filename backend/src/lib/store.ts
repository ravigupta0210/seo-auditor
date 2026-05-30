import { randomUUID } from 'node:crypto';
import type { CheckResult } from '../types/check.js';

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

export const store: ReportStore = new InMemoryStore();
