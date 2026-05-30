'use client';
import { useState } from 'react';

function getTitle(item) {
  return item?.citation_label || item?.title || item?.case_name || 'Knowledge base source';
}

function getMeta(item) {
  return item?.relevance_label || item?.section || item?.citation || item?.court || 'Verified source';
}

function isRelevantSnippet(item) {
  const text = `${item?.title || ''} ${item?.section || ''} ${item?.content || ''}`.toLowerCase();
  const relevant = ['divorce', 'maintenance', 'custody', 'wife', 'husband', 'child', 'marriage', 'adultery', 'section 94', 'section 97', 'section 100'];
  const unrelated = ['attorney general', 'dalit', 'landless', 'appropriation', 'state assembly', 'motor vehicle', 'royalty'];
  return relevant.some((term) => text.includes(term)) && !unrelated.some((term) => text.includes(term));
}

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
            <div className="citation-item__top">
              <span className="citation-badge citation-badge--law">Statute</span>
              <span className="citation-verified">verified</span>
            </div>
            <div className="citation-title">{getTitle(law)}</div>
            <div className="citation-section">{getMeta(law)}</div>
            {isRelevantSnippet(law) && (
              <details className="citation-details">
                <summary>View KB text</summary>
                <div className="citation-snippet">{law.content?.slice(0, 360)}...</div>
              </details>
            )}
          </div>
        ))}
        {tab === 'cases' && (cases || []).map((c, i) => (
          <div key={i} className="citation-item">
            <div className="citation-item__top">
              <span className="citation-badge citation-badge--case">Case</span>
              <span className="citation-verified">verified</span>
            </div>
            <div className="citation-title">{getTitle(c)}</div>
            <div className="citation-section">{getMeta(c)}</div>
            {c.content && (
              <details className="citation-details">
                <summary>View KB text</summary>
                <div className="citation-snippet">{c.content?.slice(0, 360)}...</div>
              </details>
            )}
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
