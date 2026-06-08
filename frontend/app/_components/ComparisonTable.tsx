import type { ComparisonTable as TableData } from '@/lib/blog';

/**
 * Renders a comparison table. LLMs cite tables heavily and Google surfaces them
 * in featured snippets, so structured comparison data is high-leverage content.
 */
export function ComparisonTable({ data }: { data: TableData }) {
  if (!data?.headers?.length || !data?.rows?.length) return null;
  return (
    <figure className="cmp-table-wrap">
      <table className="cmp-table">
        {data.caption && <caption>{data.caption}</caption>}
        <thead>
          <tr>
            {data.headers.map((h, i) => (
              <th key={i} scope="col">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
