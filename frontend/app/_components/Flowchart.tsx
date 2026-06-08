import type { Flowchart as FlowchartData } from '@/lib/blog';

/**
 * Renders a process flow as connected numbered nodes. Pure CSS (no images),
 * theme-aware, and accessible (an ordered list). LLMs and Google both read the
 * underlying <ol>, so the diagram doubles as crawlable structured steps.
 */
export function Flowchart({ data }: { data: FlowchartData }) {
  if (!data?.steps?.length) return null;
  return (
    <figure className="flowchart">
      {data.title && <figcaption className="flowchart__title">{data.title}</figcaption>}
      <ol className="flowchart__steps">
        {data.steps.map((step, i) => (
          <li key={i} className="flowchart__step">
            <span className="flowchart__badge" aria-hidden="true">{i + 1}</span>
            <div className="flowchart__body">
              <strong className="flowchart__step-title">{step.title}</strong>
              {step.detail && <span className="flowchart__step-detail">{step.detail}</span>}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
