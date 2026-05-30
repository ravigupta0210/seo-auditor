/**
 * Tasteful display ad slot. Renders nothing in dev / when no provider is configured.
 * Plug in Carbon Ads or EthicalAds script tags here once approved.
 */
export function AdSlot({ placement }: { placement: 'report' | 'sidebar' | 'blog' }) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === '1';
  if (!enabled) return null;
  return (
    <aside
      data-placement={placement}
      style={{
        padding: '10px 12px',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--bg-card)',
        fontSize: 11,
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: 16,
      }}
    >
      <span>Ad slot — wire up Carbon/EthicalAds script here</span>
    </aside>
  );
}
