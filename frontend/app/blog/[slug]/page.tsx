import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { Flowchart } from '@/app/_components/Flowchart';
import { Faq } from '@/app/_components/Faq';
import { ComparisonTable } from '@/app/_components/ComparisonTable';
import { JsonLd } from '@/app/_components/JsonLd';
import { getAllPosts, getPost, type BlogImage, type BlogPost } from '@/lib/blog';
import { relatedPosts, peopleAlsoSearchFor, resolvedInternalLinks } from '@/lib/internal-links';
import { pageMetadata } from '@/lib/seo';
import { blogPosting, breadcrumbList, faqPage } from '@/lib/schema';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Only build known slugs; the fs-based loader then runs at build time only.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Post not found', robots: { index: false } };
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.date,
    modifiedTime: post.updatedAt ?? post.date,
    keywords: post.keyword ? [post.keyword, ...(post.secondaryKeywords ?? [])] : undefined,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = relatedPosts(post.slug, 3);
  const pasf = peopleAlsoSearchFor(post, 6);
  const authored = resolvedInternalLinks(post, 6);
  const allFaqs = [...(post.peopleAlsoAsk ?? []), ...(post.faqs ?? [])];

  // If the body positions a visual via a token, render it there; otherwise fall
  // back to rendering it after the article body (so a visual always shows).
  const bodyHasToken = (token: string) =>
    post.sections.some((s) => s.body.some((b) => b.trim() === token));
  const usedFlowchartToken = bodyHasToken('[[flowchart]]');
  const usedTableToken = bodyHasToken('[[table]]');

  const ld: unknown[] = [
    blogPosting({
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      datePublished: post.date,
      dateModified: post.updatedAt ?? post.date,
    }),
    breadcrumbList([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];
  if (allFaqs.length) ld.push(faqPage(allFaqs));

  return (
    <>
      <SiteHeader />
      <main className="page-shell page-shell--narrow">
        <JsonLd data={ld} />

        <nav className="page-eyebrow" aria-label="Breadcrumb">
          <Link href="/blog">Blog</Link> &middot; {post.tag}
        </nav>
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

        {post.tldr && (
          <div className="post-tldr">
            <span className="post-tldr__label">TL;DR</span>
            <p className="post-tldr__text">{post.tldr}</p>
          </div>
        )}

        <article className="post-body">
          {post.sections.map((section, i) => (
            <section key={i}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.body.map((para, j) => (
                <Block key={j} text={para} post={post} />
              ))}
            </section>
          ))}

          {post.flowchart && !usedFlowchartToken && <Flowchart data={post.flowchart} />}
          {post.comparisonTable && !usedTableToken && <ComparisonTable data={post.comparisonTable} />}
        </article>

        {/* Hand-authored contextual links carried on each post. These were
            written per-post and previously rendered nowhere; targets are
            validated in resolvedInternalLinks so a missing slug can't 404. */}
        {authored.length > 0 && (
          <section className="post-links">
            <h2 className="post-links__title">More on this topic</h2>
            <ul className="post-links__list">
              {authored.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="post-links__item">
                    <span>{l.label}</span>
                    <span className="post-links__arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA — funnels every post into the actual tool */}
        <section className="cmp-cta">
          <h2 className="cmp-cta__title">Run a free audit on your site</h2>
          <p className="cmp-cta__sub">
            See how your site scores across 90+ SEO, JSON-LD, and GEO/AI-search checks — including
            everything covered in this guide. Free forever, no signup, no crawl cap.
          </p>
          <Link href="/" className="btn-primary">Audit my site →</Link>
        </section>

        <Faq items={post.peopleAlsoAsk ?? []} title="People also ask" variant="paa" id={post.slug} />
        <Faq items={post.faqs ?? []} title="Frequently asked questions" id={`faq-${post.slug}`} />

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

        {pasf.length > 0 && (
          <section className="pasf">
            <h2 className="pasf__title">People also search for</h2>
            <ul className="pasf__chips">
              {pasf.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="pasf__chip">{p.label}</Link>
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
 * Block-level renderer. Handles special tokens first ([[flowchart]], [[table]],
 * [[image:N]]), then falls through to the markdown-ish paragraph renderer.
 */
function Block({ text, post }: { text: string; post: BlogPost }) {
  const t = text.trim();
  if (t === '[[flowchart]]') return post.flowchart ? <Flowchart data={post.flowchart} /> : null;
  if (t === '[[table]]') return post.comparisonTable ? <ComparisonTable data={post.comparisonTable} /> : null;
  const imgMatch = t.match(/^\[\[image:(\d+)\]\]$/);
  if (imgMatch) {
    const img = post.images?.[Number(imgMatch[1])];
    return img ? <Figure img={img} /> : null;
  }
  // Inline markdown image: ![alt](src)
  const mdImg = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (mdImg) {
    return <Figure img={{ src: mdImg[2]!, alt: mdImg[1] ?? '', caption: mdImg[1] || undefined }} />;
  }
  return <Paragraph text={text} />;
}

function Figure({ img }: { img: BlogImage }) {
  return (
    <figure className="post-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.src} alt={img.alt} loading="lazy" />
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
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
  // Process [text](href) links, **bold**, and `code` segments.
  const parts: React.ReactNode[] = [];
  const re = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) {
      parts.push(<strong key={key++}>{t.slice(2, -2)}</strong>);
    } else if (t.startsWith('`')) {
      parts.push(<code key={key++} className="post-inline-code">{t.slice(1, -1)}</code>);
    } else {
      // markdown link
      const lm = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) {
        const href = lm[2]!;
        const isInternal = href.startsWith('/');
        parts.push(
          isInternal
            ? <Link key={key++} href={href}>{lm[1]}</Link>
            : <a key={key++} href={href} target="_blank" rel="noopener">{lm[1]}</a>,
        );
      } else {
        parts.push(t);
      }
    }
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, '');
}
