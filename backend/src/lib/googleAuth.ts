/**
 * Shared Google OAuth access-token refresh (raw fetch, no SDK).
 *
 * Exchanges a long-lived refresh token for a short-lived access token via
 * https://oauth2.googleapis.com/token, cached in-process per refresh token
 * (with a 60s safety margin). Used by both the Gmail mailer and the Search
 * Console client, which may authorize different accounts/scopes.
 */
import { logger } from './logger.js';

interface Creds {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

const cache = new Map<string, { value: string; expiresAt: number }>();

export async function getGoogleAccessToken(creds: Creds): Promise<string | null> {
  const cached = cache.get(creds.refreshToken);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15_000);
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: creds.refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: ac.signal,
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: (await res.text().catch(() => '')).slice(0, 400) }, 'Google token refresh failed');
      return null;
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cache.set(creds.refreshToken, { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
    return data.access_token;
  } catch (err) {
    logger.error({ err }, 'Google token refresh threw');
    return null;
  } finally {
    clearTimeout(timer);
  }
}
