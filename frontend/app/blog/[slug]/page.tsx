import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { POSTS, POSTS_INDEX } from '../_posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return { title: 'Post not found', robots: { index: false } };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `${SITE_URL}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const related = POSTS_INDEX.filter((p) => p.slug !== slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: 'Ravi Gupta',
      url: 'https://github.com/ravigupta0210',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SEO Auditor',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-cover.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
  };

  return (
    <>
      <SiteHeader />
      <main className="page-shell page-shell--narrow">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <p className="page-eyebrow">
          <Link href="/blog">Blog</Link> &middot; {post.tag}
        </p>
        <h1 className="page-title">{post.title}</h1>

        <div className="post-meta">
          <span className="post-meta__author">
            <span className="post-meta__avatar" aria-hidden="true">RG</span>
            <span>
              <strong>Ravi Gupta</strong>
              <em>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                {' · '}
                {post.readTime} min read
              </em>
            </span>
          </span>
          <span className={`blog-card__tag blog-card__tag--${post.tag.toLowerCase().replace(/\s+/g, '-')}`}>
            {post.tag}
          </span>
        </div>

        <article className="post-body">
          {post.sections.map((section, i) => (
            <section key={i}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.body.map((para, j) => (
                <Paragraph key={j} text={para} />
              ))}
            </section>
          ))}
        </article>

        {/* CTA */}
        <section className="cmp-cta">
          <h2 className="cmp-cta__title">Run a free audit on your site</h2>
          <p className="cmp-cta__sub">
            See how your site scores across 40+ checks, including everything covered in this guide.
            Free forever, no signup, no crawl cap.
          </p>
          <Link href="/" className="btn-primary">Audit my site →</Link>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="post-related">
            <h2 className="page-subtitle">Keep reading</h2>
            <ul className="post-related__list">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="post-related__card glass-card">
                    <span className={`blog-card__tag blog-card__tag--${r.tag.toLowerCase().replace(/\s+/g, '-')}`}>
                      {r.tag}
                    </span>
                    <h3>{r.title}</h3>
                    <p>{r.excerpt}</p>
                    <span className="post-related__cta">Read →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Minimal markdown-ish renderer: code blocks (```…```), bold (**…**),
 * blockquotes (> …), bullet lists (lines starting with - ). Anything else
 * renders as a paragraph with light inline-code support (`…`).
 */
function Paragraph({ text }: { text: string }) {
  if (text.startsWith('```')) {
    const code = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
    return <pre className="post-code"><code>{code}</code></pre>;
  }
  if (text.startsWith('> ')) {
    return <blockquote className="post-quote">{stripMd(text.slice(2))}</blockquote>;
  }
  if (text.includes('\n- ')) {
    const items = text.split(/\n- /).slice(1);
    return (
      <ul className="post-list">
        {items.map((item, i) => <li key={i}>{renderInline(item.replace(/\n$/, ''))}</li>)}
      </ul>
    );
  }
  return <p>{renderInline(text)}</p>;
}

function renderInline(text: string): React.ReactNode {
  // Process **bold** and `code` segments
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) {
      parts.push(<strong key={key++}>{t.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={key++} className="post-inline-code">{t.slice(1, -1)}</code>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, '');
}
