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
          </ul>
        </div>

        <div className="site-footer__col">
          <h3 className="site-footer__heading">Resources</h3>
          <ul className="site-footer__list">
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

        <div className="site-footer__col">
          <h3 className="site-footer__heading">Project</h3>
          <ul className="site-footer__list">
            <li>
              <a href="mailto:gravi5964@gmail.com">
                Contact &amp; feedback <span className="site-footer__ext">✉</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/ravigupta0210/seo-auditor"
                target="_blank"
                rel="noopener"
              >
                Source code <span className="site-footer__ext">↗</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/ravigupta0210/seo-auditor/issues"
                target="_blank"
                rel="noopener"
              >
                Report an issue <span className="site-footer__ext">↗</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/ravigupta0210/seo-auditor/blob/main/README.md"
                target="_blank"
                rel="noopener"
              >
                Documentation <span className="site-footer__ext">↗</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/sponsors/ravigupta0210"
                target="_blank"
                rel="noopener"
              >
                GitHub Sponsors <span className="site-footer__ext">↗</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p className="site-footer__copy">
          © {FOOTER_YEAR} SEO Auditor &middot; MIT licensed open source
        </p>
        <p className="site-footer__credit">
          Built by{' '}
          <a
            href="https://github.com/ravigupta0210"
            target="_blank"
            rel="noopener"
            className="site-footer__author"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.79.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            <span>@ravigupta0210</span>
          </a>
          {' · '}
          <span className="site-footer__small">Hosted on Vercel + Render free tiers</span>
        </p>
      </div>
    </footer>
  );
}
