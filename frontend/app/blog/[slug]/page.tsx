import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const POSTS: Record<string, { title: string; date: string; description: string; body: string[] }> = {
  'llms-txt-explained': {
    title: 'llms.txt: the new robots.txt for AI crawlers',
    date: '2026-05-01',
    description: 'A practical guide to writing an llms.txt file that helps ChatGPT, Claude, and Perplexity find and cite your content.',
    body: [
      'llms.txt is a plain-text file you place at the root of your site (like robots.txt) that describes what your site is about and which pages matter for AI consumers. The format was proposed in late 2024 and adoption is accelerating across documentation sites, SaaS landing pages, and personal blogs.',
      'The minimum spec is simple: an H1 with your site name, a blockquote with a one-sentence summary, and an H2 section listing your key pages as Markdown links with short descriptions. That is it. No JSON, no XML, no schema.',
      'Why bother in 2026? AI search engines cite content they can summarise confidently. A curated, machine-readable index of your site reduces hallucinations about your product and increases the chance you appear in answers to questions like "what is X?" or "how does X compare to Y?".',
      'The most common mistake is treating llms.txt as a sitemap dump. Do not list 5,000 URLs. List the 10-30 pages an AI would need to understand your business: home, about, pricing, docs index, a couple of flagship guides. Quality over coverage.',
      'You can audit your current llms.txt for spec compliance using our free tool — paste your domain and it will check both the file presence and the structure.',
    ],
  },
  'island-test-geo': {
    title: 'The Island Test: how to write paragraphs AI engines will cite',
    date: '2026-04-15',
    description: 'AI engines lift individual paragraphs as citations. Paragraphs that stand alone get cited. Paragraphs that rely on context do not.',
    body: [
      'The Island Test, popularised by Princeton/Georgia Tech researchers studying generative engine optimisation, asks one question of every paragraph in your content: can it be cited as a standalone unit?',
      'A passing paragraph names its subject explicitly in the first six words, avoids anaphoric references like "this", "it", or "as mentioned above", stays under 80 words, and reads as factual rather than narrative or rhetorical.',
      'In practice, this means rewriting "It works by..." to "The compiler works by..." and breaking a 200-word wall of text into three self-contained 60-word paragraphs.',
      'You do not need every paragraph to pass — the goal is to maximise citation surface area. A 1,200-word article with 15 paragraphs and 10 standalone-passing ones gives an AI engine 10 candidate citations.',
      'Our auditor scores every paragraph on a 0-4 scale across the four criteria above. Pages scoring above 2.5 average tend to appear in Perplexity and ChatGPT citations within a few weeks of publication.',
    ],
  },
  'json-ld-required-fields': {
    title: 'JSON-LD required fields: the 78% rule',
    date: '2026-03-30',
    description: 'Most structured-data errors are syntax. The other 22% are missing required fields. Here is the cheatsheet.',
    body: [
      'According to Google\'s public structured-data error reports, 78% of JSON-LD failures are syntax — trailing commas, smart quotes pasted from a CMS, unclosed brackets, or missing @context. The remaining 22% are missing required fields per Google\'s rich-result eligibility specs.',
      'For Article, Google requires headline, author, datePublished, and image. NewsArticle and BlogPosting use the same set. Product needs name, image, and offers. Recipe needs name, image, recipeIngredient, and recipeInstructions. Event needs name, startDate, and location.',
      'The trap is that JSON-LD can validate (parse cleanly, no syntax errors) and still fail rich-result eligibility because of missing required fields. Schema.org Validator only checks structure; Google\'s Rich Results Test checks eligibility. Use both.',
      'Dates must be ISO 8601 (2026-05-01 or 2026-05-01T14:30:00Z). URLs in image, url, sameAs, and logo must be absolute — relative URLs are silently dropped.',
      'Our auditor parses every JSON-LD block, checks required + recommended fields per type, validates date formats, and flags relative URLs. It catches all three layers of failure in one pass.',
    ],
  },
};

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
    openGraph: { title: post.title, description: post.description, type: 'article', publishedTime: post.date },
  };
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'SEO Auditor' },
    publisher: { '@type': 'Organization', name: 'SEO Auditor' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://example.com/blog/${slug}` },
  };

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/blog" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Blog</Link>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '20px 0 4px' }}>{new Date(post.date).toLocaleDateString()}</p>
      <h1 style={{ fontSize: 32, margin: '0 0 22px', lineHeight: 1.2 }}>{post.title}</h1>
      <article style={{ fontSize: 16, lineHeight: 1.7 }}>
        {post.body.map((p, i) => (
          <p key={i} style={{ margin: '0 0 18px' }}>{p}</p>
        ))}
      </article>

      <section style={{ marginTop: 32, padding: '18px 22px', background: 'var(--accent-strong)', borderRadius: 'var(--radius)' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, color: '#fff' }}>Run a free audit</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          See how your site scores across 30+ checks including everything covered in this post.
        </p>
        <Link href="/" style={{ background: '#fff', color: '#000', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Audit my site →
        </Link>
      </section>
    </main>
  );
}
