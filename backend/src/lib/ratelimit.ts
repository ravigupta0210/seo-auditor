import type { Request } from 'express';

/**
 * Tiny in-memory sliding-window rate limiter. Good enough to blunt abuse of the
 * write endpoints on a single free-tier instance; not a distributed limiter.
 */
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0]!.trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/** Returns true if the request is allowed, false if the limit is exceeded. */
export function rateLimit(req: Request, bucket: string, max: number, windowMs: number): boolean {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}

/**
 * Global in-flight cap.
 *
 * Rate limiting is per-IP, so it does nothing against many clients arriving at
 * once — and a single site crawl can fetch up to 100 pages sequentially. On a
 * free-tier instance a handful of concurrent crawls is enough to exhaust RAM
 * and take the whole service down. This bounds total concurrent work
 * regardless of how it is distributed across callers.
 */
const inFlight = new Map<string, number>();

export function acquireSlot(bucket: string, max: number): boolean {
  const n = inFlight.get(bucket) ?? 0;
  if (n >= max) return false;
  inFlight.set(bucket, n + 1);
  return true;
}

export function releaseSlot(bucket: string): void {
  const n = inFlight.get(bucket) ?? 0;
  inFlight.set(bucket, Math.max(0, n - 1));
}

export function slotsInUse(bucket: string): number {
  return inFlight.get(bucket) ?? 0;
}
