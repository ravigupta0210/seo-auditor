/**
 * Renders a JSON-LD structured-data block. Accepts a single object or an array
 * (rendered as multiple <script> tags). Server-component safe.
 */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
