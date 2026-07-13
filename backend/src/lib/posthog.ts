/**
 * PostHog read client via the Query API (HogQL), raw fetch.
 *
 * Config (degrades to null/disabled when unset):
 *   POSTHOG_API_KEY     Personal API key (read scope for query/insights).
 *   POSTHOG_PROJECT_ID  Numeric project id (Settings → Project).
 *   POSTHOG_HOST        Defaults to https://us.posthog.com (US cloud).
 */
import { logger } from './logger.js';

const API_KEY = process.env.POSTHOG_API_KEY?.trim();
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID?.trim();
const HOST = (process.env.POSTHOG_HOST?.trim() || 'https://us.posthog.com').replace(/\/$/, '');

export const phEnabled = Boolean(API_KEY && PROJECT_ID);

/** Run a HogQL query; returns rows (array of column arrays) or null on failure. */
async function phQuery(hogql: string): Promise<unknown[][] | null> {
  if (!phEnabled) return null;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 20_000);
  try {
    const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
      method: 'POST',
      headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
      signal: ac.signal,
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: (await res.text().catch(() => '')).slice(0, 400) }, 'PostHog query failed');
      return null;
    }
    const data = (await res.json()) as { results?: unknown[][] };
    return data.results ?? [];
  } catch (err) {
    logger.error({ err }, 'PostHog query threw');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const FUNNEL_EVENTS = ['audit_started', 'audit_completed', 'email_captured', 'help_requested', 'feedback_submitted'];

/** Composite analytics snapshot for the admin dashboard. */
export async function posthogOverview(days = 30): Promise<{
  days: number;
  visitors: number;
  pageviews: number;
  events: Record<string, number>;
  conversionRate: number;
} | null> {
  if (!phEnabled) return null;
  const d = [7, 30, 90].includes(days) ? days : 30;
  const eventList = FUNNEL_EVENTS.map((e) => `'${e}'`).join(', ');

  const [visitorsRes, pvRes, eventsRes] = await Promise.all([
    phQuery(`SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - INTERVAL ${d} DAY`),
    phQuery(`SELECT count() FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${d} DAY`),
    phQuery(`SELECT event, count() FROM events WHERE event IN (${eventList}) AND timestamp > now() - INTERVAL ${d} DAY GROUP BY event`),
  ]);

  const events: Record<string, number> = Object.fromEntries(FUNNEL_EVENTS.map((e) => [e, 0]));
  for (const row of eventsRes ?? []) {
    const name = String(row[0]);
    if (name in events) events[name] = Number(row[1]) || 0;
  }
  const started = events.audit_started || 0;
  const captured = events.email_captured || 0;
  const conversionRate = started > 0 ? Math.round((captured / started) * 1000) / 10 : 0;

  return {
    days: d,
    visitors: Number(visitorsRes?.[0]?.[0]) || 0,
    pageviews: Number(pvRes?.[0]?.[0]) || 0,
    events,
    conversionRate,
  };
}
