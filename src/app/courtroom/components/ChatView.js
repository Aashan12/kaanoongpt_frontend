'use client';
import { useRef, useEffect, useState } from 'react';
import SubAgentProgress from './SubAgentProgress';
import CitationsSidebar from './CitationsSidebar';
import HumanInput from './HumanInput';

const ROLE_META = {
  plaintiff: { label: 'Plaintiff', color: '#3b82f6', bg: '#0d1f3c', border: '#3b82f6', align: 'flex-start' },
  defendant: { label: 'Defendant', color: '#ef4444', bg: '#1f0d0d', border: '#ef4444', align: 'flex-end' },
  judge:     { label: 'Judge',     color: '#f59e0b', bg: '#1a1500', border: '#f59e0b', align: 'center' },
  human:     { label: 'You',       color: '#10b981', bg: '#0d2b1e', border: '#10b981', align: 'flex-start' },
};

const PHASE_LABELS = {
  research: '🔍 Research Phase',
  opening_statements: '📋 Opening Statements',
  argument_rounds: '⚔️ Argument Rounds',
  closing_statements: '🎤 Closing Statements',
  verdict: '⚖️ Verdict',
};

// Simple markdown → JSX (bold, italic, headers, bullets)
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="md-h2">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="md-h1">{line.slice(2)}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i}>{inlineFormat(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="md-ul">{items}</ul>);
      continue;
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} className="md-p">{inlineFormat(line)}</p>);
    }
    i++;
  }
  return elements;
}

function inlineFormat(text) {
  // Bold **text** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// Typewriter hook — animates text character by character
function useTypewriter(text, speed = 8) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const prevText = useRef('');

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    // If text grew (streaming), animate only the new part
    if (text.startsWith(prevText.current)) {
      const newPart = text.slice(prevText.current.length);
      if (!newPart) return;
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setDisplayed(prevText.current + newPart.slice(0, idx));
        if (idx >= newPart.length) {
          clearInterval(interval);
          prevText.current = text;
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    } else {
      // New message entirely
      prevText.current = '';
      setDisplayed('');
      setDone(false);
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setDisplayed(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(interval);
          prevText.current = text;
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }
  }, [text]);

  return { displayed, done };
}

// DeepSeek-style thinking block
function ThinkingBlock({ steps, agentName, isActive }) {
  const [open, setOpen] = useState(isActive);

  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  if (!steps?.length && !isActive) return null;

  return (
    <div className={`thinking-block ${isActive ? 'thinking-block--active' : ''}`}>
      <button className="thinking-toggle" onClick={() => setOpen(o => !o)}>
        <span className="thinking-icon">{isActive ? '🧠' : '💭'}</span>
        <span className="thinking-label">
          {isActive ? `${agentName} is thinking...` : `Thought for ${steps?.length || 0} step${steps?.length !== 1 ? 's' : ''}`}
        </span>
        <span className="thinking-chevron">{open ? '▲' : '▼'}</span>
        {isActive && (
          <span className="thinking-dots">
            <span /><span /><span />
          </span>
        )}
      </button>
      {open && (
        <div className="thinking-content">
          {steps?.map((step, i) => (
            <div key={i} className="thinking-step-line">
              <span className="thinking-step-num">{i + 1}</span>
              <span className="thinking-step-text">{step}</span>
            </div>
          ))}
          {isActive && (
            <div className="thinking-step-line thinking-step-line--active">
              <span className="thinking-step-num">…</span>
              <span className="thinking-step-text thinking-blink">Analyzing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Single animated message bubble
function MessageBubble({ msg, isLatest }) {
  const meta = ROLE_META[msg.role] || ROLE_META.plaintiff;
  // Only animate the latest message
  const { displayed } = useTypewriter(isLatest ? msg.content : null, 6);
  const content = isLatest ? displayed : msg.content;

  return (
    <div className="msg-wrapper" style={{ alignSelf: meta.align }}>
      <div
        className="msg-bubble"
        style={{ background: meta.bg, borderLeftColor: meta.border }}
      >
        <div className="msg-header">
          <span className="msg-role" style={{ color: meta.color }}>{meta.label}</span>
          {msg.round > 0 && <span className="msg-round">Round {msg.round}</span>}
          {msg.type === 'verdict' && msg.winner && (
            <span className="msg-winner">🏆 Winner: {msg.winner}</span>
          )}
          {msg.type === 'evaluation' && <span className="msg-tag">Evaluation</span>}
        </div>

        {/* Thinking block above content */}
        {msg.thinking_steps?.length > 0 && (
          <ThinkingBlock steps={msg.thinking_steps} agentName={meta.label} isActive={false} />
        )}

        <div className="msg-content">
          {renderMarkdown(content)}
          {isLatest && content !== msg.content && <span className="cursor-blink">▋</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChatView({
  session,
  messages,
  subAgentStatus,
  thinkingSteps,
  waitingForInput,
  trialComplete,
  error,
  onSendArgument,
  onStop,
  onRetry,
}) {
  const bottomRef = useRef(null);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [researchData, setResearchData] = useState({ laws: [], cases: [] });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, subAgentStatus]);

  useEffect(() => {
    const r = messages.find((m) => m.type === 'research_complete');
    if (r) setResearchData({ laws: r.laws || [], cases: r.cases || [] });
  }, [messages]);

  function downloadTranscript() {
    const text = messages
      .filter((m) => ['argument', 'evaluation', 'verdict'].includes(m.type))
      .map((m) => `[${(m.role || '').toUpperCase()}]\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session?.case_name || 'trial'}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Find index of last renderable message for typewriter
  const renderableMessages = messages.filter(m =>
    ['argument', 'evaluation', 'verdict'].includes(m.type)
  );
  const lastRenderableIdx = renderableMessages.length - 1;

  return (
    <div className="chat-view">
      {/* Header */}
      <div className="chat-view__header">
        <div className="chat-header-left">
          <h3 className="case-title">{session?.case_name}</h3>
          {session?.court_type_name && (
            <span className="court-type-badge">{session.court_type_name}</span>
          )}
        </div>
        <div className="chat-header-right">
          <button className="btn-citations" onClick={() => setCitationsOpen(true)}>📚 Citations</button>
          {!trialComplete && onStop && (
            <button className="btn-stop" onClick={onStop} title="Stop trial">
              ⏹ Stop
            </button>
          )}
          {trialComplete && (
            <button className="btn-download" onClick={downloadTranscript}>⬇ Transcript</button>
          )}
        </div>
      </div>

      {/* Active sub-agent progress bar */}
      <SubAgentProgress subAgentStatus={subAgentStatus} />

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          if (msg.type === 'phase_start') {
            return (
              <div key={i} className="phase-divider">
                <span>{PHASE_LABELS[msg.phase] || msg.phase}</span>
              </div>
            );
          }
          if (msg.type === 'research_complete') {
            return (
              <div key={i} className="research-banner">
                📚 Research complete — {msg.laws_count} statutes · {msg.cases_count} cases
              </div>
            );
          }
          if (msg.type === 'sub_agent_error') {
            return (
              <div key={i} className="sub-agent-error-msg">
                ⚠️ <strong>{msg.pipeline} → {msg.agent_name}</strong>: {msg.content}
              </div>
            );
          }
          if (['argument', 'evaluation', 'verdict'].includes(msg.type)) {
            const renderIdx = renderableMessages.indexOf(msg);
            return (
              <MessageBubble
                key={i}
                msg={msg}
                isLatest={renderIdx === lastRenderableIdx && !trialComplete}
              />
            );
          }
          return null;
        })}

        {/* Active thinking while sub-agent runs */}
        {subAgentStatus && (
          <div className="msg-wrapper" style={{ alignSelf: 'center' }}>
            <ThinkingBlock
              steps={thinkingSteps}
              agentName={`${subAgentStatus.pipeline} → ${subAgentStatus.agent_name}`}
              isActive={true}
            />
          </div>
        )}

        {error && (
          <div className="trial-error">
            ⚠️ {error}
            {onRetry && (
              <button className="btn-retry" onClick={onRetry}>↺ Retry</button>
            )}
          </div>
        )}
        {trialComplete && <div className="trial-complete-banner">✅ Trial Complete</div>}
        <div ref={bottomRef} />
      </div>

      <HumanInput waitingForInput={waitingForInput} onSend={onSendArgument} />

      <CitationsSidebar
        laws={researchData.laws}
        cases={researchData.cases}
        open={citationsOpen}
        onClose={() => setCitationsOpen(false)}
      />
    </div>
  );
}
