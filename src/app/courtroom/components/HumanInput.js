'use client';
import { useState } from 'react';

export default function HumanInput({ waitingForInput, onSend }) {
  const [text, setText] = useState('');

  if (!waitingForInput) return null;

  const { research_refs } = waitingForInput;
  const hasRefs = research_refs && (research_refs.laws?.length || research_refs.cases?.length);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
  }

  return (
    <div className="human-input">
      {hasRefs && (
        <div className="human-input__refs">
          <div className="refs-label">Research references available:</div>
          <div className="refs-list">
            {research_refs.laws?.slice(0, 2).map((l, i) => (
              <span key={i} className="ref-chip ref-chip--law">{l.title}</span>
            ))}
            {research_refs.cases?.slice(0, 2).map((c, i) => (
              <span key={i} className="ref-chip ref-chip--case">{c.title}</span>
            ))}
          </div>
        </div>
      )}

      <div className="human-input__box">
        <textarea
          rows={4}
          placeholder="Type your legal argument... (Ctrl+Enter to send)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
        />
        <div className="human-input__footer">
          <span className="char-count">{text.length} chars</span>
          <button className="btn-send" onClick={handleSend} disabled={!text.trim()}>
            Submit Argument →
          </button>
        </div>
      </div>
    </div>
  );
}
