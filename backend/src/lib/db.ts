/**
 * Postgres connection + schema.
 *
 * The whole app degrades gracefully when DATABASE_URL is unset: `pool` is null,
 * `dbEnabled` is false, and callers fall back to the in-memory store / skip
 * persistence. Set DATABASE_URL to a free hosted Postgres (Supabase / Neon) to
 * persist audits, email leads, and feedback for analysis.
 *
 * Use the Supabase "Session pooler" (or direct) connection string. SSL is
 * enabled automatically for any non-localhost host.
 */
import pg from 'pg';
import { logger } from './logger.js';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL?.trim();

function needsSsl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
  } catch {
    return false;
  }
}

export const pool: pg.Pool | null = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: needsSsl(DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

export const dbEnabled = pool !== null;

if (pool) {
  pool.on('error', (err) => logger.error({ err }, 'postgres pool error'));
}

let schemaReady = false;

/** Create tables if they don't exist. Best-effort — logs and returns on failure. */
export async function ensureSchema(): Promise<void> {
  if (!pool || schemaReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audits (
        id             uuid PRIMARY KEY,
        url            text NOT NULL,
        scope          text NOT NULL,
        overall_score  int,
        pages_analyzed int,
        duration_ms    int,
        rule_version   text,
        report         jsonb NOT NULL,
        created_at     timestamptz NOT NULL DEFAULT now(),
        finished_at    timestamptz
      );
      CREATE INDEX IF NOT EXISTS audits_created_at_idx ON audits (created_at DESC);
      CREATE INDEX IF NOT EXISTS audits_url_idx ON audits (url);

      CREATE TABLE IF NOT EXISTS email_leads (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email       text NOT NULL,
        audit_id    uuid,
        url         text,
        report_sent boolean NOT NULL DEFAULT false,
        created_at  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS email_leads_email_idx ON email_leads (email);
      CREATE INDEX IF NOT EXISTS email_leads_created_at_idx ON email_leads (created_at DESC);

      CREATE TABLE IF NOT EXISTS feedback (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text,
        email      text,
        message    text NOT NULL,
        url        text,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);

      CREATE TABLE IF NOT EXISTS sent_emails (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        to_email   text NOT NULL,
        kind       text NOT NULL,
        subject    text,
        body       text,
        audit_id   uuid,
        success    boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS sent_emails_created_at_idx ON sent_emails (created_at DESC);

      CREATE TABLE IF NOT EXISTS gsc_snapshots (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind        text NOT NULL,
        data        jsonb NOT NULL,
        captured_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS gsc_snapshots_kind_idx ON gsc_snapshots (kind, captured_at DESC);

      -- Paid-service lead capture. This is the revenue funnel: a prospect runs a
      -- free audit, then asks us to quote for fixing what it found. audit_id
      -- links back to the report so a quote is written with their real failures
      -- in front of us rather than a generic pitch.
      CREATE TABLE IF NOT EXISTS quote_requests (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name         text,
        email        text NOT NULL,
        company      text,
        site_url     text NOT NULL,
        audit_id     uuid,
        audit_score  int,
        tier         text,
        stack        text,
        requirements text NOT NULL,
        timeline     text,
        budget       text,
        repo_access  text,
        status       text NOT NULL DEFAULT 'new',
        user_agent   text,
        referrer     text,
        created_at   timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS quote_requests_created_at_idx ON quote_requests (created_at DESC);
      CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON quote_requests (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS quote_requests_email_idx ON quote_requests (email);
    `);
    schemaReady = true;
    logger.info('postgres schema ready');
  } catch (err) {
    logger.error({ err }, 'ensureSchema failed — persistence disabled for this run');
  }
}
