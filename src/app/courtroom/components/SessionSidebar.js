'use client';
import { useEffect } from 'react';

const STATUS_LABELS = {
  in_progress: { label: 'In Progress', cls: 'badge--progress' },
  completed: { label: 'Completed', cls: 'badge--done' },
  paused: { label: 'Paused', cls: 'badge--paused' },
};

export default function SessionSidebar({ sessions, loading, onSelect, onNew, onDelete, activeId, onLoad }) {
  useEffect(() => { onLoad?.(); }, []);

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getSessionTitle(session) {
    const plaintiff = session.plaintiff_name?.trim();
    const defendant = session.defendant_name?.trim();
    const hasNamedParties =
      plaintiff &&
      defendant &&
      plaintiff.toLowerCase() !== 'plaintiff' &&
      defendant.toLowerCase() !== 'defendant';

    if (hasNamedParties) return `${plaintiff} vs ${defendant}`;
    return session.case_name || 'Court Session';
  }

  return (
    <aside className="session-sidebar">
      <div className="session-sidebar__header">
        <span className="session-sidebar__title">Sessions</span>
        <button className="btn-new-trial" onClick={onNew}>+ New</button>
      </div>

      {loading && <div className="sidebar-loading">Loading...</div>}

      {!loading && sessions.length === 0 && (
        <div className="sidebar-empty">No sessions yet. Start one!</div>
      )}

      <ul className="session-list">
        {sessions.map((s) => {
          const badge = STATUS_LABELS[s.status] || { label: s.status, cls: '' };
          return (
            <li
              key={s.id}
              className={`session-item ${activeId === s.id ? 'session-item--active' : ''}`}
              onClick={() => onSelect(s)}
            >
              <div className="session-item__name">{getSessionTitle(s)}</div>
              <div className="session-item__meta">
                <span className={`badge ${badge.cls}`}>{badge.label}</span>
                <span className="session-item__date">{formatDate(s.created_at)}</span>
              </div>
              {s.winner && (
                <div className="session-item__winner">
                  Winner: <strong>{s.winner}</strong>
                </div>
              )}
              <button
                className="session-item__delete"
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                title="Delete session"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
