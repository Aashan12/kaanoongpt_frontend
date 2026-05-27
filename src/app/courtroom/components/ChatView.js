'use client';
import { useRef, useEffect, useState } from 'react';
import SubAgentProgress from './SubAgentProgress';
import CitationsSidebar from './CitationsSidebar';
import HumanInput from './HumanInput';

const ROLE_META = {
  plaintiff: { label: 'फिरादी पक्ष', color: '#7a4f25', bg: '#ffffff', border: '#d8c3ad', align: 'flex-start' },
  defendant: { label: 'प्रतिवादी पक्ष', color: '#7a4f25', bg: '#ffffff', border: '#d8c3ad', align: 'flex-start' },
  judge:     { label: 'श्रीमान्',     color: '#475569', bg: '#f8fafc', border: '#cbd5e1', align: 'flex-start' },
  human:     { label: 'You',       color: '#111827', bg: '#f4eee7', border: '#d8c3ad', align: 'flex-end' },
};

const PHASE_LABELS = {
  document_review: 'Document Match Check',
  research: 'Research Phase',
  opening_statements: 'Opening Statements',
  argument_rounds: 'Argument Rounds',
  closing_statements: 'Closing Statements',
  verdict: 'Judgment',
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

function formatSessionDate(iso) {
  if (!iso) return 'Not recorded';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getResearchCounts(session) {
  const results = session?.research_results || {};
  const laws = Array.isArray(results.laws) ? results.laws.length : 0;
  const cases = Array.isArray(results.cases) ? results.cases.length : 0;
  return { laws, cases };
}

function formatSourceTitle(source) {
  return source?.title || source?.name || source?.act_name || source?.case_name || 'Knowledge base source';
}

function SystemMessage({ content }) {
  return (
    <div className="system-message">
      <div className="system-message__label">System</div>
      <p>{content}</p>
    </div>
  );
}

function KnowledgeBaseCheck({ msg }) {
  const laws = msg.laws || [];
  const cases = msg.cases || [];
  const verifiedSources = [...laws.slice(0, 4), ...cases.slice(0, 2)];

  return (
    <div className="kb-check-card">
      <div className="kb-check-card__label">Knowledge Base Check</div>
      {verifiedSources.length > 0 ? (
        <ul>
          {verifiedSources.map((source, index) => (
            <li key={`${formatSourceTitle(source)}-${index}`}>
              <span>{formatSourceTitle(source)}</span>
              <strong>verified</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>कुनै प्रमाणित कानून वा नजिर भेटिएन। एजेन्टले अपलोड गरिएको कागजातका तथ्यमा मात्र आधारित भएर काम गर्छ।</p>
      )}
    </div>
  );
}

function CaseAnalysis({ msg }) {
  const status = msg.matched ? 'Matched' : 'Mismatch';
  const parties = msg.shared_parties?.length ? msg.shared_parties : ['पक्षहरू स्पष्ट रूपमा मिलेनन्'];
  const issues = msg.issues?.length ? msg.issues : ['मुख्य प्रश्न कागजातबाट स्पष्ट भएन'];

  return (
    <div className={`case-analysis ${msg.matched ? 'case-analysis--matched' : 'case-analysis--mismatch'}`}>
      <div className="case-analysis__label">Case Match Analysis</div>
      <div className="case-analysis__summary">
        <strong>{status}</strong>
        <span>{msg.case_type || 'मुद्दाको प्रकार अज्ञात'}</span>
      </div>
      <div className="case-analysis__checks">
        <span data-ok={msg.parties_matched ? 'true' : 'false'}>
          पक्षहरू: {msg.parties_matched ? 'मिलेको' : 'नमिलेको'}
        </span>
        <span data-ok={msg.case_type_matched ? 'true' : 'false'}>
          मुद्दा प्रकार: {msg.case_type_matched ? 'मिलेको' : 'नमिलेको'}
        </span>
      </div>
      <div className="case-analysis__grid">
        <div>
          <span>मिलेका पक्षहरू</span>
          <p>{parties.join(', ')}</p>
        </div>
        <div>
          <span>मुख्य प्रश्नहरू</span>
          <p>{issues.join(', ')}</p>
        </div>
      </div>
      {msg.reason && <p className="case-analysis__reason">{msg.reason}</p>}
    </div>
  );
}

function CompletedEmptyState({ session }) {
  const { laws, cases } = getResearchCounts(session);
  const hasVerdict = Boolean(session?.verdict?.trim());

  return (
    <div className="completed-empty">
      <div className="completed-empty__status">Session completed</div>
      <h2>Transcript preview unavailable</h2>
      <p>
        This session is marked complete, but there are no saved courtroom messages
        to display in the history view.
      </p>

      <div className="completed-empty__meta">
        <div>
          <span>Created</span>
          <strong>{formatSessionDate(session?.created_at)}</strong>
        </div>
        <div>
          <span>Rounds</span>
          <strong>{session?.num_rounds || 0}</strong>
        </div>
        <div>
          <span>Research</span>
          <strong>{laws} laws / {cases} cases</strong>
        </div>
        <div>
          <span>Winner</span>
          <strong>{session?.winner || 'Not recorded'}</strong>
        </div>
      </div>

      {hasVerdict && (
        <div className="completed-empty__verdict">
          <span>Saved verdict</span>
          <p>{session.verdict}</p>
        </div>
      )}
    </div>
  );
}

export default function ChatView({
  session,
  messages,
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
  }, [messages]);

  useEffect(() => {
    const r = messages.find((m) => m.type === 'kb_check' || m.type === 'research_complete');
    if (r) {
      setResearchData({ laws: r.laws || [], cases: r.cases || [] });
      return;
    }

    const savedResearch = session?.research_results;
    if (savedResearch) {
      setResearchData({
        laws: savedResearch.laws || [],
        cases: savedResearch.cases || [],
      });
    }
  }, [messages, session]);

  function downloadTranscript() {
    const text = messages
      .filter((m) => ['argument', 'evaluation', 'verdict'].includes(m.type))
      .map((m) => `[${(m.role || '').toUpperCase()}]\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session?.case_name || 'court-session'}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Find index of last renderable message for typewriter
  const renderableMessages = messages.filter(m =>
    ['argument', 'evaluation', 'verdict'].includes(m.type)
  );
  const lastRenderableIdx = renderableMessages.length - 1;
  const hasRenderableMessages = renderableMessages.length > 0;
  const showCompletedEmptyState = trialComplete && !hasRenderableMessages && !error;
  const isPaused = session?.status === 'paused';
  const chatViewClassName = `chat-view ${showCompletedEmptyState ? 'chat-view--completed-empty' : ''}`;

  return (
    <div className={chatViewClassName}>
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
          {!trialComplete && !isPaused && onStop && (
            <button className="btn-stop" onClick={onStop} title="Stop session">
              ⏹ Stop
            </button>
          )}
          {trialComplete && (
            <button
              className="btn-download"
              onClick={downloadTranscript}
              disabled={!hasRenderableMessages}
              title={hasRenderableMessages ? 'Download transcript' : 'No transcript messages saved'}
            >
              ⬇ Transcript
            </button>
          )}
        </div>
      </div>

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
          if (msg.type === 'system') {
            return <SystemMessage key={i} content={msg.content} />;
          }
          if (msg.type === 'kb_check') {
            return <KnowledgeBaseCheck key={i} msg={msg} />;
          }
          if (msg.type === 'case_analysis') {
            return <CaseAnalysis key={i} msg={msg} />;
          }
          if (msg.type === 'agent_work') {
            return <SubAgentProgress key={i} work={msg} />;
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

        {error && (
          <div className="trial-error">
            ⚠️ {error}
            {onRetry && (
              <button className="btn-retry" onClick={onRetry}>↺ Retry</button>
            )}
          </div>
        )}
        {trialComplete && <div className="trial-complete-banner">✅ Session Complete</div>}
        {isPaused && !trialComplete && <div className="session-paused-banner">⏸ Session Paused</div>}
        {showCompletedEmptyState && <CompletedEmptyState session={session} />}
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
