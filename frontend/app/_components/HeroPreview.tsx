import { ScoreRing } from './ScoreRing';

/**
 * A static preview of a real audit result, shown in the hero.
 *
 * Nothing on the homepage previously showed what the tool actually produces, so
 * a first-time visitor had to run an audit before learning what they'd get.
 * This is modelled on a genuine report — the severities, categories and copy
 * are all real check output — and is labelled as an example so it can't be
 * mistaken for live data.
 */
const FINDINGS = [
  { sev: 'error',   cat: 'geo',      text: 'Page content requires JavaScript — 0 words in raw HTML' },
  { sev: 'warning', cat: 'metadata', text: 'No <link rel="canonical"> declared' },
  { sev: 'warning', cat: 'geo',      text: 'robots.txt blocks GPTBot (OpenAI) from entire site' },
  { sev: 'pass',    cat: 'security', text: 'Served over HTTPS with HSTS' },
] as const;

export function HeroPreview() {
  return (
    <div className="hero-preview" aria-label="Example audit result">
      <div className="hero-preview__chrome">
        <span className="hero-preview__dot" />
        <span className="hero-preview__dot" />
        <span className="hero-preview__dot" />
        <span className="hero-preview__url">example.com · single-page audit</span>
      </div>

      <div className="hero-preview__body">
        <div className="hero-preview__score">
          <ScoreRing score={62} size={94} />
          <div className="hero-preview__totals">
            <span><strong className="sev-error">1</strong> error</span>
            <span><strong className="sev-warning">2</strong> warnings</span>
            <span><strong className="sev-pass">30</strong> passed</span>
          </div>
        </div>

        <ul className="hero-preview__list">
          {FINDINGS.map((f) => (
            <li key={f.text} className={`hero-preview__row hero-preview__row--${f.sev}`}>
              <span className={`hero-preview__sev sev-${f.sev}`}>{f.sev}</span>
              <span className="hero-preview__text">{f.text}</span>
              <span className="hero-preview__cat">{f.cat}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="hero-preview__caption">
        Example result — every finding expands with a copy-paste fix.
      </p>
    </div>
  );
}
