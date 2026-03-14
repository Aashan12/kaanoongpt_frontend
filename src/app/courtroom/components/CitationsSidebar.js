'use client';
import { useState } from 'react';

export default function CitationsSidebar({ laws, cases, open, onClose }) {
  const [tab, setTab] = useState('laws');

  if (!open) return null;

  return (
    <div className="citations-sidebar">
      <div className="citations-sidebar__header">
        <span>Legal References</span>
        <button onClick={onClose} className="citations-close">×</button>
      </div>

      <div className="citations-tabs">
        <button className={`tab-btn ${tab === 'laws' ? 'tab-btn--active' : ''}`} onClick={() => setTab('laws')}>
          Statutes ({laws?.length || 0})
        </button>
        <button className={`tab-btn ${tab === 'cases' ? 'tab-btn--active' : ''}`} onClick={() => setTab('cases')}>
          Cases ({cases?.length || 0})
        </button>
      </div>

      <div className="citations-list">
        {tab === 'laws' && (laws || []).map((law, i) => (
          <div key={i} className="citation-item">
            <span className="citation-badge citation-badge--law">Statute</span>
            <div className="citation-title">{law.title}</div>
            {law.section && <div className="citation-section">{law.section}</div>}
            <div className="citation-snippet">{law.content?.slice(0, 200)}...</div>
          </div>
        ))}
        {tab === 'cases' && (cases || []).map((c, i) => (
          <div key={i} className="citation-item">
            <span className="citation-badge citation-badge--case">Case</span>
            <div className="citation-title">{c.title}</div>
            {c.citation && <div className="citation-section">{c.citation}</div>}
            {c.court && <div className="citation-court">{c.court}</div>}
            <div className="citation-snippet">{c.content?.slice(0, 200)}...</div>
          </div>
        ))}
        {((tab === 'laws' && (!laws || laws.length === 0)) ||
          (tab === 'cases' && (!cases || cases.length === 0))) && (
          <div className="citations-empty">No {tab === 'laws' ? 'statutes' : 'cases'} found.</div>
        )}
      </div>
    </div>
  );
}
