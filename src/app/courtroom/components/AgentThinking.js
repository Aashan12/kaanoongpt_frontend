'use client';
import { useState } from 'react';

export default function AgentThinking({ steps, agentName, isActive }) {
  const [expanded, setExpanded] = useState(false);

  if (!isActive && (!steps || steps.length === 0)) return null;

  return (
    <div className={`agent-thinking ${isActive ? 'agent-thinking--active' : ''}`}>
      <button
        className="agent-thinking__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="thinking-icon">{isActive ? '🧠' : '💭'}</span>
        <span>{isActive ? `${agentName || 'Agent'} is thinking...` : `${agentName || 'Agent'} reasoning`}</span>
        <span className="toggle-arrow">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && steps && steps.length > 0 && (
        <ul className="thinking-steps">
          {steps.map((step, i) => (
            <li key={i} className="thinking-step">{step}</li>
          ))}
        </ul>
      )}

      {isActive && (
        <div className="thinking-animation">
          <span /><span /><span />
        </div>
      )}
    </div>
  );
}
