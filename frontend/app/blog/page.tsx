import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — SEO, JSON-LD, and AI-search optimization',
  description: 'Practical guides on classic SEO, structured data, llms.txt, and ranking in AI search engines (ChatGPT, Claude, Perplexity).',
};

const POSTS = [
  {
    slug: 'llms-txt-explained',
    title: 'llms.txt: the new robots.txt for AI crawlers',
    excerpt: 'llms.txt is an emerging convention for telling LLMs what your site is about. Here is why every site should ship one in 2026.',
    date: '2026-05-01',
  },
  {
    slug: 'island-test-geo',
    title: 'The Island Test: how to write paragraphs AI engines will cite',
    excerpt: 'AI engines lift individual paragraphs as citations. Paragraphs that stand alone get cited. Paragraphs that rely on context do not.',
    date: '2026-04-15',
  },
  {
    slug: 'json-ld-required-fields',
    title: 'JSON-LD required fields: the 78% rule',
    excerpt: 'Most structured-data errors are syntax. The other 22% are missing required fields. Here is the cheatsheet.',
    date: '2026-03-30',
  },
];

export default function BlogIndex() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Home</Link>
      <h1 style={{ fontSize: 32, margin: '20px 0 8px' }}>Blog</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>
        Hand-written guides on what actually ranks in classic + AI search.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {POSTS.map((p) => (
          <li key={p.slug} style={{ padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString()}</p>
            <Link href={`/blog/${p.slug}`} style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
              {p.title}
            </Link>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
