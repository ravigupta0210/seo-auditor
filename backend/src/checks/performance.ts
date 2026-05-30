import type { CheckResult, PageContext } from '../types/check.js';
import { logger } from '../lib/logger.js';

const RULE_VERSION = 'v0.1.0';
const PSI_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface PSIResult {
  lighthouseResult?: {
    audits?: Record<string, { score?: number | null; displayValue?: string; title?: string; numericValue?: number }>;
    categories?: { performance?: { score: number } };
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile: number; category: string }>;
  };
}

export async function runPerformanceChecks(page: PageContext): Promise<CheckResult[]> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return [{
      id: 'performance.psi.skipped',
      category: 'performance',
      severity: 'info',
      title: 'PageSpeed Insights skipped (no API key configured)',
      whyItMatters:
        'Without a free PageSpeed Insights API key, we can\'t measure Core Web Vitals. Set PAGESPEED_API_KEY in your env to enable.',
      fix: {
        summary: 'Get a free PSI API key and set PAGESPEED_API_KEY in the backend env. 25k requests/day are free.',
        docLink: 'https://developers.google.com/speed/docs/insights/v5/get-started',
      },
      priority: 10,
      ruleVersion: RULE_VERSION,
    }];
  }

  try {
    const url = `${PSI_URL}?url=${encodeURIComponent(page.url)}&category=performance&strategy=mobile&key=${apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PSI returned ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = (await response.json()) as PSIResult;
    return interpretPSI(data);
  } catch (err) {
    logger.warn({ err }, 'PageSpeed Insights call failed');
    return [{
      id: 'performance.psi.error',
      category: 'performance',
      severity: 'info',
      title: 'PageSpeed Insights check failed',
      evidence: { error: err instanceof Error ? err.message : String(err) },
      whyItMatters: 'Could not retrieve performance data this run.',
      fix: { summary: 'Re-run audit later or check your API key.', docLink: 'https://developers.google.com/speed/docs/insights/v5/get-started' },
      priority: 5,
      ruleVersion: RULE_VERSION,
    }];
  }
}

function interpretPSI(data: PSIResult): CheckResult[] {
  const results: CheckResult[] = [];
  const perfScore = (data.lighthouseResult?.categories?.performance?.score ?? 0) * 100;

  if (perfScore < 50) {
    results.push({
      id: 'performance.score.poor',
      category: 'performance',
      severity: 'error',
      title: `Performance score is ${Math.round(perfScore)}/100 (poor)`,
      evidence: { perfScore },
      whyItMatters:
        'Performance scores below 50 indicate severe Core Web Vitals issues. Mobile users will abandon before the page renders.',
      fix: { summary: 'See the breakdown below and tackle LCP first.', docLink: 'https://web.dev/articles/lcp' },
      priority: 90,
      ruleVersion: RULE_VERSION,
    });
  } else if (perfScore < 90) {
    results.push({
      id: 'performance.score.fair',
      category: 'performance',
      severity: 'warning',
      title: `Performance score is ${Math.round(perfScore)}/100 (room to improve)`,
      whyItMatters: 'Google uses Core Web Vitals as a ranking signal; scores ≥90 give a competitive edge.',
      fix: { summary: 'Target the largest opportunities in the breakdown below.', docLink: 'https://web.dev/articles/lcp' },
      priority: 55,
      ruleVersion: RULE_VERSION,
    });
  } else {
    results.push({
      id: 'performance.score.good',
      category: 'performance',
      severity: 'pass',
      title: `Performance score is ${Math.round(perfScore)}/100 (excellent)`,
      whyItMatters: 'Core Web Vitals are strong.',
      fix: { summary: 'No action needed.', docLink: 'https://web.dev/articles/vitals' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    });
  }

  // Field data (CrUX)
  const metrics = data.loadingExperience?.metrics ?? {};
  const thresholds: Record<string, { name: string; good: number; poor: number; unit: string }> = {
    LARGEST_CONTENTFUL_PAINT_MS: { name: 'LCP', good: 2500, poor: 4000, unit: 'ms' },
    INTERACTION_TO_NEXT_PAINT: { name: 'INP', good: 200, poor: 500, unit: 'ms' },
    CUMULATIVE_LAYOUT_SHIFT_SCORE: { name: 'CLS', good: 0.1, poor: 0.25, unit: '' },
  };

  for (const [key, meta] of Object.entries(thresholds)) {
    const m = metrics[key];
    if (!m) continue;
    const p75 = key === 'CUMULATIVE_LAYOUT_SHIFT_SCORE' ? m.percentile / 100 : m.percentile;
    const severity: CheckResult['severity'] =
      p75 <= meta.good ? 'pass' :
      p75 <= meta.poor ? 'warning' : 'error';
    results.push({
      id: `performance.cwv.${meta.name.toLowerCase()}`,
      category: 'performance',
      severity,
      title: `${meta.name} (p75): ${p75}${meta.unit} — ${m.category.toLowerCase()}`,
      evidence: { metric: key, p75, threshold: meta },
      whyItMatters:
        meta.name === 'LCP' ? 'Largest Contentful Paint is the biggest content render. Slow LCP = bounce.' :
        meta.name === 'INP' ? 'Interaction to Next Paint measures input responsiveness. High INP = frustrated users.' :
        'Cumulative Layout Shift measures visual stability. High CLS = annoying re-layouts.',
      fix: {
        summary:
          meta.name === 'LCP' ? 'Optimize hero image (WebP, lazy-load below-fold), preload critical resources.' :
          meta.name === 'INP' ? 'Reduce main-thread JS, break up long tasks, defer non-critical scripts.' :
          'Set explicit width/height on images, avoid injecting content above existing.',
        docLink: meta.name === 'LCP' ? 'https://web.dev/articles/lcp' : meta.name === 'INP' ? 'https://web.dev/articles/inp' : 'https://web.dev/articles/cls',
      },
      priority: severity === 'error' ? 80 : severity === 'warning' ? 50 : 0,
      ruleVersion: RULE_VERSION,
    });
  }

  return results;
}
