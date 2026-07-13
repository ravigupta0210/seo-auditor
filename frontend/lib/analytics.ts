import posthog from 'posthog-js';

/**
 * Fire a custom PostHog event. Safe no-op when PostHog isn't initialized
 * (e.g. no NEXT_PUBLIC_POSTHOG_KEY, or SSR). Use for funnel events like
 * audit_started / audit_completed / email_captured / help_requested.
 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    posthog.capture(event, props);
  } catch {
    /* PostHog not initialized — ignore */
  }
}
