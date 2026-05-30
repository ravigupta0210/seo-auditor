export type Severity = 'error' | 'warning' | 'info' | 'pass';

export type Category =
  | 'metadata'
  | 'jsonld'
  | 'content'
  | 'crawl'
  | 'performance'
  | 'geo'
  | 'accessibility'
  | 'security';

export interface CheckFix {
  summary: string;
  snippet?: string;
  steps?: string[];
  docLink: string;
}

export interface CheckResult {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  evidence?: unknown;
  whyItMatters: string;
  fix: CheckFix;
  priority: number;
  ruleVersion: string;
}

export interface PageContext {
  url: string;
  html: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  fetchedAt: string;
}
