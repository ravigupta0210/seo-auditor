import { assertPublicHostname } from '../lib/ssrf.js';
import type { PageContext } from '../types/check.js';

const MAX_BYTES = 50 * 1024 * 1024;
const TIMEOUT_MS = 30_000;

export const DEFAULT_UA =
  'SEOAuditorBot/0.1 (+https://github.com/ravigupta/seo-auditor - contact for issues)';

export const AI_USER_AGENTS = {
  default: DEFAULT_UA,
  gptbot: 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)',
  perplexitybot: 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  claudebot: 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://anthropic.com/claudebot)',
  oaiSearchbot: 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)',
  googleExtended: 'Mozilla/5.0 (compatible; Google-Extended)',
} as const;

export type UserAgentKey = keyof typeof AI_USER_AGENTS;

export interface FetchOptions {
  ua?: UserAgentKey;
}

export async function fetchPage(url: string, opts: FetchOptions = {}): Promise<PageContext> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }

  await assertPublicHostname(parsed.hostname);

  const ua = AI_USER_AGENTS[opts.ua ?? 'default'];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': ua,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.body) {
      throw new Error('Response has no body');
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

    let bytesRead = 0;
    const chunks: Uint8Array[] = [];
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytesRead += value.length;
        if (bytesRead > MAX_BYTES) {
          await reader.cancel();
          throw new Error(`Response exceeded ${MAX_BYTES} bytes`);
        }
        chunks.push(value);
      }
    }

    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { merged.set(c, offset); offset += c.length; }
    const html = new TextDecoder('utf-8').decode(merged);

    return {
      url,
      finalUrl: response.url || url,
      status: response.status,
      html,
      headers,
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}
