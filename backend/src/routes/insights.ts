import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { checkAdmin } from '../lib/adminAuth.js';
import { gscEnabled, gscOverview } from '../lib/gsc.js';
import { phEnabled, posthogOverview } from '../lib/posthog.js';

export const insightsRouter = Router();

/**
 * GET /api/insights?key=<ADMIN_TOKEN>&days=7|30|90
 * Owner-only growth snapshot combining Google Search Console + PostHog. Each
 * source is null (with a reason) when its env is unset, so the admin dashboard
 * degrades cleanly.
 */
insightsRouter.get('/', async (req: Request, res: Response) => {
  if (!checkAdmin(req, res)) return;
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;

  try {
    const [gsc, posthog] = await Promise.all([
      gscEnabled ? gscOverview(days) : Promise.resolve(null),
      phEnabled ? posthogOverview(days) : Promise.resolve(null),
    ]);

    res.json({
      days,
      gsc,
      gscReason: gscEnabled ? null : 'Search Console not configured — set GSC_REFRESH_TOKEN + GSC_SITE_URL on the backend.',
      posthog,
      posthogReason: phEnabled ? null : 'PostHog not configured — set POSTHOG_API_KEY + POSTHOG_PROJECT_ID on the backend.',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'insights query failed');
    res.status(500).json({ error: 'Query failed' });
  }
});
