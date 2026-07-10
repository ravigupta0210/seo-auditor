import Link from 'next/link';

const FOOTER_YEAR = '2026';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="site-footer__brand-row">
            <span className="site-footer__logo" />
            <span className="site-footer__brand-name">SEO Auditor</span>
          </div>
          <p className="site-footer__tagline">
            Free, comprehensive SEO + JSON-LD + GEO audits for every public page on your site.
            No signup. No paywall. No crawl cap. Ever.
          </p>
          <p className="site-footer__tagline">
            📧 Contact: <a href="mailto:freeseoaudittool@gmail.com">freeseoaudittool@gmail.com</a>
          </p>
          <div className="site-footer__status">
            <span className="site-footer__status-dot" aria-hidden="true" />
            <span>All systems operational</span>
          </div>
        </div>

        <div className="site-footer__col">
          <h3 className="site-footer__heading">Product</h3>
          <ul className="site-footer__list">
            <li><Link href="/">Audit a site</Link></li>
            <li><Link href="/check">All 40+ checks</Link></li>
            <li><Link href="/compare">Tool comparisons</Link></li>
            <li><Link href="/blog">Blog &amp; guides</Link></li>
            <li><Link href="/help">How we help</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3 className="site-footer__heading">Resources</h3>
          <ul className="site-footer__list">
            <li>
              <Link href="/feedback">Contact &amp; feedback ✉</Link>
            </li>
            <li>
              <a href="https://llmstxt.org/" target="_blank" rel="noopener">
                llms.txt spec <span className="site-footer__ext">↗</span>
              </a>
            </li>
            <li>
              <a
                href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide"
                target="_blank"
                rel="noopener"
              >
                Google SEO guide <span className="site-footer__ext">↗</span>
              </a>
            </li>
            <li>
              <a href="https://schema.org/docs/full.html" target="_blank" rel="noopener">
                Schema.org reference <span className="site-footer__ext">↗</span>
              </a>
            </li>
            <li>
              <a
                href="https://developers.google.com/search/docs/appearance/structured-data"
                target="_blank"
                rel="noopener"
              >
                Rich results gallery <span className="site-footer__ext">↗</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p className="site-footer__copy">
          © {FOOTER_YEAR} SEO Auditor &middot; MIT licensed open source
        </p>
      </div>
    </footer>
  );
}
