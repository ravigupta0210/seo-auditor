'use client';

import { useEffect, useRef, useState } from 'react';

const LOGO_KEY = 'wl_logo';
const BRAND_KEY = 'wl_brand';
const COMPANY_KEY = 'wl_company';

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

/**
 * White-label PDF export for the audit report. Agencies can add their own logo
 * + a "Prepared by" name (stored client-side in localStorage — no account), then
 * hit Download PDF: the print stylesheet strips all site chrome, expands every
 * finding, and prints a clean, branded, client-ready report. No backend needed.
 */
export function PdfExport({
  host,
  url,
  score,
  createdAt,
}: {
  host: string;
  url: string;
  score: number;
  createdAt: string;
}) {
  const [logo, setLogo] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [brand, setBrand] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setLogo(localStorage.getItem(LOGO_KEY));
      setCompany(localStorage.getItem(COMPANY_KEY) || '');
      setBrand(localStorage.getItem(BRAND_KEY) || '');
    } catch {
      /* ignore */
    }
  }, []);

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      alert('Please use an image under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      setLogo(data);
      try {
        localStorage.setItem(LOGO_KEY, data);
      } catch {
        /* ignore */
      }
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogo(null);
    try {
      localStorage.removeItem(LOGO_KEY);
    } catch {
      /* ignore */
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function onBrand(v: string) {
    setBrand(v);
    try {
      if (v) localStorage.setItem(BRAND_KEY, v);
      else localStorage.removeItem(BRAND_KEY);
    } catch {
      /* ignore */
    }
  }

  function onCompany(v: string) {
    setCompany(v);
    try {
      if (v) localStorage.setItem(COMPANY_KEY, v);
      else localStorage.removeItem(COMPANY_KEY);
    } catch {
      /* ignore */
    }
  }

  let dateStr = '';
  try {
    dateStr = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    /* ignore */
  }

  return (
    <>
      {/* On-screen controls (hidden when printing) */}
      <div
        className="no-print"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, margin: '0 0 20px' }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.print()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <DownloadIcon />
          Download PDF
        </button>

        {logo ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="Your logo" style={{ height: 24, maxWidth: 120, objectFit: 'contain', borderRadius: 4 }} />
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ padding: '6px 10px', fontSize: 12 }}>
              Change
            </button>
            <button type="button" className="btn btn-secondary" onClick={removeLogo} style={{ padding: '6px 10px', fontSize: 12 }}>
              Remove
            </button>
          </span>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            + Add your logo
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickLogo} style={{ display: 'none' }} />

        <input
          value={company}
          onChange={(e) => onCompany(e.target.value)}
          placeholder="Company name (optional)"
          className="field-input"
          style={{ width: 200, padding: '8px 10px', fontSize: 13 }}
          maxLength={80}
        />

        <input
          value={brand}
          onChange={(e) => onBrand(e.target.value)}
          placeholder="Prepared by (optional)"
          className="field-input"
          style={{ width: 200, padding: '8px 10px', fontSize: 13 }}
          maxLength={80}
        />

        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexBasis: '100%' }}>
          White-label: add your logo + name, then <strong>Download PDF</strong> for a clean, client-ready report.
        </span>
      </div>

      {/* Branded header — only rendered in the printed/PDF version */}
      <div className="print-only pdf-brand-header">
        <div className="pdf-brand-top">
          <div className="pdf-brand-id">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="pdf-brand-logo" />
            ) : null}
            {company ? (
              <span className="pdf-brand-company">{company}</span>
            ) : !logo ? (
              <span className="pdf-brand-fallback">SEO + GEO Audit</span>
            ) : null}
          </div>
          {brand ? <span className="pdf-brand-by">Prepared by {brand}</span> : null}
        </div>
        <h1 className="pdf-brand-title">SEO + GEO Audit Report</h1>
        <div className="pdf-brand-meta">
          <span><strong>{host}</strong></span>
          <span>{url}</span>
          <span>{dateStr}</span>
        </div>
        <div className="pdf-brand-score">
          Overall score: <strong>{score}/100</strong>
        </div>
      </div>
    </>
  );
}
