'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/check', label: 'Checks' },
  { href: '/compare', label: 'Compare' },
  { href: '/blog', label: 'Blog' },
];

export function SiteHeader() {
  const pathname = usePathname() || '/';

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <BrandMark />
        <nav className="site-header__nav" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-header__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
