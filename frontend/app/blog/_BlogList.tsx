'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface BlogPostCard {
  slug: string;
  title: string;
  date: string;
  readTime: number;
  excerpt: string;
  tag: string;
}

/**
 * Interactive blog index: the topic-filter chips actually filter the list.
 * Kept as a client component so `useState` works; markup/classNames mirror the
 * previous server render so styling is unchanged.
 */
export function BlogList({ posts, tags }: { posts: BlogPostCard[]; tags: string[] }) {
  const [active, setActive] = useState('All');

  const filtered = useMemo(
    () => (active === 'All' ? posts : posts.filter((p) => p.tag === active)),
    [posts, active],
  );

  return (
    <>
      <div className="blog-tags" role="tablist" aria-label="Topic filters">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            role="tab"
            aria-selected={tag === active}
            onClick={() => setActive(tag)}
            className={`blog-tag${tag === active ? ' is-active' : ''}`}
          >
            {tag}
          </button>
        ))}
      </div>

      <ul className="blog-list">
        {filtered.map((p, i) => (
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
              {active === 'All' && i === 0 && <span className="blog-card__pin">Featured</span>}
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)', padding: '20px 0', fontSize: 14 }}>
          No posts in this topic yet.
        </p>
      )}
    </>
  );
}
