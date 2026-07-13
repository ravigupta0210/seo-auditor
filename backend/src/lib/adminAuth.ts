/**
 * Shared owner-only auth for admin/insights endpoints. The single gate is
 * ADMIN_TOKEN, passed by the frontend as ?key=<token>.
 */
import type { Request, Response } from 'express';
import { pool } from './db.js';

export const ADMIN_TOKEN = process.env.ADMIN_TOKEN?.trim();

/** Token check only. Returns true if allowed; writes 403/401 otherwise. */
export function checkAdmin(req: Request, res: Response): boolean {
  if (!ADMIN_TOKEN) {
    res.status(403).json({ error: 'Disabled. Set ADMIN_TOKEN on the backend to enable.' });
    return false;
  }
  const key = String(req.query.key ?? '');
  if (key.length !== ADMIN_TOKEN.length || key !== ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

/** Token check + require a configured Postgres pool (for DB-backed routes). */
export function requireAdminAndDb(req: Request, res: Response): boolean {
  if (!checkAdmin(req, res)) return false;
  if (!pool) {
    res.status(503).json({ error: 'No database configured (DATABASE_URL unset).' });
    return false;
  }
  return true;
}
