import type { CheckResult, PageContext } from '../types/check.js';

const RULE_VERSION = 'v0.1.0';

export function runSecurityChecks(page: PageContext): CheckResult[] {
  const headers = page.headers;
  const results: CheckResult[] = [];
  const isHttps = page.url.startsWith('https://') || page.finalUrl.startsWith('https://');

  if (!isHttps) {
    results.push({
      id: 'security.https.missing',
      category: 'security',
      severity: 'error',
      title: 'Page is served over HTTP, not HTTPS',
      whyItMatters:
        'Google uses HTTPS as a ranking signal and Chrome marks HTTP pages "Not Secure". HTTPS is non-negotiable in 2026.',
      fix: {
        summary: 'Install a free Let\'s Encrypt cert (Cloudflare, Certbot) and redirect 80→443.',
        docLink: 'https://letsencrypt.org/getting-started/',
      },
      priority: 95,
      ruleVersion: RULE_VERSION,
    });
  } else {
    results.push(passCheck('security.https.ok', 'security', 'Served over HTTPS', 'https://letsencrypt.org/'));
  }

  results.push(checkHeader(headers, 'strict-transport-security', 'HSTS', {
    why: 'HSTS forces browsers to upgrade HTTP → HTTPS automatically, defending against downgrade attacks.',
    snippet: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
  }));

  results.push(checkHeader(headers, 'content-security-policy', 'Content-Security-Policy', {
    why: 'CSP prevents XSS by restricting which scripts can run. Without it, any reflected/stored XSS hits unmitigated.',
    snippet: "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy',
    severity: 'warning',
  }));

  results.push(checkHeader(headers, 'x-frame-options', 'X-Frame-Options', {
    why: 'X-Frame-Options (or frame-ancestors CSP) prevents your site being embedded in iframes for clickjacking attacks.',
    snippet: 'X-Frame-Options: SAMEORIGIN',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
    severity: 'warning',
  }));

  results.push(checkHeader(headers, 'referrer-policy', 'Referrer-Policy', {
    why: 'Referrer-Policy controls how much URL info leaks to other sites in the Referer header.',
    snippet: 'Referrer-Policy: strict-origin-when-cross-origin',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
    severity: 'info',
  }));

  results.push(checkHeader(headers, 'x-content-type-options', 'X-Content-Type-Options', {
    why: 'X-Content-Type-Options: nosniff prevents MIME-type sniffing attacks.',
    snippet: 'X-Content-Type-Options: nosniff',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
    severity: 'info',
  }));

  // Compression
  const encoding = headers['content-encoding'] ?? '';
  if (!/br|gzip|zstd/i.test(encoding)) {
    results.push({
      id: 'security.compression.missing',
      category: 'performance',
      severity: 'warning',
      title: 'Response is not compressed (no Content-Encoding)',
      evidence: { contentEncoding: encoding },
      whyItMatters:
        'Uncompressed HTML can be 4-10× larger over the wire, hurting LCP and mobile data costs.',
      fix: { summary: 'Enable Brotli or gzip at your CDN/server. Cloudflare/Vercel do this automatically.', docLink: 'https://web.dev/articles/reduce-network-payloads-using-text-compression' },
      priority: 50,
      ruleVersion: RULE_VERSION,
    });
  } else {
    results.push(passCheck('security.compression.ok', 'performance', `Response compressed with ${encoding}`, 'https://web.dev/articles/reduce-network-payloads-using-text-compression'));
  }

  return results;
}

function checkHeader(
  headers: Record<string, string>,
  name: string,
  display: string,
  opts: { why: string; snippet: string; docLink: string; severity?: 'error' | 'warning' | 'info' }
): CheckResult {
  const value = headers[name];
  const severity = opts.severity ?? 'warning';
  if (!value) {
    return {
      id: `security.${name}.missing`,
      category: 'security',
      severity,
      title: `Missing ${display} header`,
      whyItMatters: opts.why,
      fix: { summary: `Add the ${display} header.`, snippet: opts.snippet, docLink: opts.docLink },
      priority: severity === 'error' ? 75 : severity === 'warning' ? 45 : 25,
      ruleVersion: RULE_VERSION,
    };
  }
  return {
    id: `security.${name}.ok`,
    category: 'security',
    severity: 'pass',
    title: `${display} header present`,
    evidence: { [name]: value },
    whyItMatters: 'Header is configured.',
    fix: { summary: 'No action needed.', docLink: opts.docLink },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function passCheck(id: string, category: CheckResult['category'], title: string, doc: string): CheckResult {
  return {
    id,
    category,
    severity: 'pass',
    title,
    whyItMatters: 'OK.',
    fix: { summary: 'No action needed.', docLink: doc },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}
