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
    `);
    schemaReady = true;
    logger.info('postgres schema ready');
  } catch (err) {
    logger.error({ err }, 'ensureSchema failed — persistence disabled for this run');
  }
}
