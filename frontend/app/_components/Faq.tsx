import type { FaqItem } from '@/lib/blog';

/**
 * Accordion FAQ / "People also ask" block. Uses native <details>/<summary> so
 * it works with zero JS. The page is responsible for emitting the matching
 * FAQPage JSON-LD (see lib/schema.faqPage) — keep the rendered Q&A text and the
 * schema text identical, which Google requires for FAQ rich results.
 */
export function Faq({
  items,
  title = 'Frequently asked questions',
  variant = 'faq',
  id,
}: {
  items: FaqItem[];
  title?: string;
  variant?: 'faq' | 'paa';
  id?: string;
}) {
  if (!items?.length) return null;
  return (
    <section className={`faq faq--${variant}`} id={id}>
      <h2 className="faq__title">{title}</h2>
      <div className="faq__list">
        {items.map((item, i) => (
          <details key={i} className="faq__item" name={variant === 'paa' ? `paa-${id ?? 'group'}` : undefined}>
            <summary className="faq__q">
              <span>{item.q}</span>
              <span className="faq__chev" aria-hidden="true">+</span>
            </summary>
            <div className="faq__a">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
