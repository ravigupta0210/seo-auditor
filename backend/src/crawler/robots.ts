import { fetchPage } from './fetcher.js';
import { DEFAULT_UA } from './fetcher.js';

export interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

export interface RobotsTxt {
  url: string;
  status: number;
  raw: string;
  rules: RobotsRule[];
  sitemaps: string[];
  parseErrors: string[];
}

export async function fetchRobotsTxt(origin: string): Promise<RobotsTxt> {
  const robotsUrl = new URL('/robots.txt', origin).toString();
  try {
    const page = await fetchPage(robotsUrl);
    return parseRobotsTxt(robotsUrl, page.status, page.html);
  } catch (err) {
    return {
      url: robotsUrl,
      status: 0,
      raw: '',
      rules: [],
      sitemaps: [],
      parseErrors: [err instanceof Error ? err.message : String(err)],
    };
  }
}

export function parseRobotsTxt(url: string, status: number, raw: string): RobotsTxt {
  const lines = raw.split(/\r?\n/);
  const rules: RobotsRule[] = [];
  const sitemaps: string[] = [];
  const parseErrors: string[] = [];

  let current: RobotsRule | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.replace(/#.*$/, '').trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      parseErrors.push(`Line ${i + 1}: missing ":" → "${line}"`);
      continue;
    }
    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (field === 'user-agent') {
      if (!current || current.userAgent !== value) {
        current = { userAgent: value, allow: [], disallow: [] };
        rules.push(current);
      }
    } else if (field === 'allow') {
      if (current) current.allow.push(value);
      else parseErrors.push(`Line ${i + 1}: Allow without preceding User-agent`);
    } else if (field === 'disallow') {
      if (current) current.disallow.push(value);
      else parseErrors.push(`Line ${i + 1}: Disallow without preceding User-agent`);
    } else if (field === 'sitemap') {
      sitemaps.push(value);
    } else if (field === 'crawl-delay') {
      // we don't enforce, just acknowledge
    } else {
      // unknown directive — Google ignores, no error
    }
  }

  return { url, status, raw, rules, sitemaps, parseErrors };
}

export function isAllowed(robots: RobotsTxt, pathname: string, ua = DEFAULT_UA): boolean {
  if (robots.status === 404 || robots.status === 0) return true;
  // Find longest matching User-agent block
  const uaLower = ua.toLowerCase();
  let bestRule: RobotsRule | null = null;
  let bestLen = -1;
  for (const r of robots.rules) {
    const tok = r.userAgent.toLowerCase();
    if (tok === '*' && bestLen < 0) {
      bestRule = r;
      bestLen = 0;
    } else if (tok !== '*' && uaLower.includes(tok) && tok.length > bestLen) {
      bestRule = r;
      bestLen = tok.length;
    }
  }
  if (!bestRule) return true;

  // Longest-match: precedence to the most specific Allow/Disallow
  let decision: 'allow' | 'disallow' | null = null;
  let bestMatch = -1;
  for (const a of bestRule.allow) {
    if (matchPath(a, pathname) && a.length > bestMatch) {
      decision = 'allow';
      bestMatch = a.length;
    }
  }
  for (const d of bestRule.disallow) {
    if (d === '') continue; // empty Disallow means allow everything
    if (matchPath(d, pathname) && d.length > bestMatch) {
      decision = 'disallow';
      bestMatch = d.length;
    }
  }
  return decision !== 'disallow';
}

function matchPath(pattern: string, path: string): boolean {
  if (pattern === '') return false;
  // Convert robots wildcard pattern to regex
  let regex = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === '*') regex += '.*';
    else if (c === '$' && i === pattern.length - 1) regex += '$';
    else regex += c.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
  }
  if (!regex.endsWith('$')) regex += '.*';
  return new RegExp('^' + regex).test(path);
}
