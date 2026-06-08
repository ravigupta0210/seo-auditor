import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { JsonLd } from '@/app/_components/JsonLd';
import { getPostIndex, getTags } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbList } from '@/lib/schema';

export const metadata: Metadata = pageMetadata({
  title: 'Blog — SEO, JSON-LD, and AI-search (GEO) optimization guides',
  description:
    'Practical, hand-written guides on classic SEO, JSON-LD structured data, llms.txt, the Island Test, ' +
    'and ranking in the new AI search engines (ChatGPT, Claude, Perplexity, Google AI Overviews).',
  path: '/blog',
});

export default function BlogIndex() {
  const posts = getPostIndex();
  const tags = ['All', ...getTags()];

  return (
    <>
      <SiteHeader />
      <main className="page-shell page-shell--narrow">
        <JsonLd data={breadcrumbList([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])} />
        <p className="page-eyebrow">Blog</p>
        <h1 className="page-title">SEO + GEO guides for 2026</h1>
        <p className="page-lede">
          Hand-written guides on what actually ranks in classic search and the new AI search engines.
          No SEO buzzwords, no AI-generated filler, no &ldquo;ultimate&rdquo; lists. Just specific,
          opinionated, tested advice you can act on today.
        </p>

        <div className="blog-tags" role="list" aria-label="Topic filters">
          {tags.map((tag) => (
            <span key={tag} className={`blog-tag${tag === 'All' ? ' is-active' : ''}`} role="listitem">
              {tag}
            </span>
          ))}
        </div>

        <ul className="blog-list">
          {posts.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="blog-card glass-card">
                <div className="blog-card__meta">
                  <span className={`blog-card__tag blog-card__tag--${p.tag.toLowerCase().replace(/\s+/g, '-')}`}>
                    {p.tag}
                  </span>
                  <time dateTime={p.date}>
                    {new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <span className="blog-card__read">{p.readTime} min read</span>
                </div>
                <h2 className="blog-card__title">{p.title}</h2>
                <p className="blog-card__excerpt">{p.excerpt}</p>
                <span className="blog-card__cta">
                  Read article <span aria-hidden="true">→</span>
                </span>
                {i === 0 && <span className="blog-card__pin">Featured</span>}
              </Link>
            </li>
          ))}
        </ul>

        <section className="blog-newsletter">
          <div>
            <h2 className="blog-newsletter__title">Want updates?</h2>
            <p className="blog-newsletter__sub">
              No newsletter yet — but starring the repo means you&apos;ll see new posts when we release them.
            </p>
          </div>
          <a
            href="https://github.com/ravigupta0210/seo-auditor"
            target="_blank"
            rel="noopener"
            className="btn-secondary"
          >
            Star on GitHub ★
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
