'use client';
import { useRef, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import SubAgentProgress from './SubAgentProgress';
import CitationsSidebar from './CitationsSidebar';
import HumanInput from './HumanInput';

const ROLE_META = {
  plaintiff: { label: 'Plaintiff', color: '#7a4f25', bg: '#ffffff', border: '#d8c3ad', align: 'flex-start' },
  defendant: { label: 'Defendant', color: '#7a4f25', bg: '#ffffff', border: '#d8c3ad', align: 'flex-end' },
  judge:     { label: 'Judge',     color: '#475569', bg: '#f8fafc', border: '#cbd5e1', align: 'center' },
  human:     { label: 'You',       color: '#111827', bg: '#f4eee7', border: '#d8c3ad', align: 'flex-end' },
};

const PHASE_LABELS = {
  document_review: 'Document Match Check',
  research: 'Legal Research Phase',
  opening_statements: 'Opening Statements',
  argument_rounds: 'Counter Arguments',
  closing_statements: 'Closing Statements',
  verdict: 'Verdict',
};

const ROLE_LABELS_NE = {
  plaintiff: 'Plaintiff',
  defendant: 'Defendant',
  judge: 'Judge',
  human: 'तपाईं',
};

const PHASE_LABELS_NE = {
  document_review: 'Document Match / कागजात मिलान',
  research: 'Legal Research / कानूनी अनुसन्धान',
  opening_statements: 'Opening Statements / प्रारम्भिक बहस',
  argument_rounds: 'Counter Arguments / प्रतिवाद',
  closing_statements: 'Closing Statements / अन्तिम बहस',
  verdict: 'Verdict / फैसला',
};

function hasDevanagari(text = '') {
  return /[\u0900-\u097F]/.test(String(text));
}

function isNepaliMessage(msg = {}) {
  return hasDevanagari(msg.content) || hasDevanagari(msg.case_type) || hasDevanagari(msg.reason);
}

function toNepaliDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
}

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

function cleanRoundContent(msg = {}) {
  if (msg.phase !== 'argument_rounds' || !msg.content) return msg.content || '';

  const roleLabels = [
    ROLE_LABELS_NE[msg.role],
    ROLE_META[msg.role]?.label,
    'Plaintiff',
    'फिरादी पक्ष',
    'Defendant',
    'प्रतिवादी पक्ष',
    'Judge',
    'न्यायाधीश',
    'Evaluation',
    'मूल्याङ्कन',
  ].filter(Boolean);
  const roundPattern = new RegExp(`^(Round\\s+${msg.round}|चरण\\s*(${msg.round}|${toNepaliDigits(msg.round)}))$`, 'i');

  return msg.content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (roleLabels.includes(trimmed)) return false;
      if (roundPattern.test(trimmed)) return false;
      return true;
    })
    .join('\n')
    .trim();
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

function normalizeThoughtSteps(steps, role) {
  const filtered = (steps || []).filter((step) => {
    const normalized = String(step || '').toLowerCase();
    return step && !normalized.startsWith('reviewing case facts');
  });

  if (filtered.length) return filtered;

  if (role === 'judge') {
    return ['दुवै पक्षको बहस हेर्दै...', 'मुख्य विवाद र प्रमाण छुट्याउँदै...', 'अर्को आदेशको आधार तयार गर्दै...'];
  }
  if (role === 'defendant') {
    return ['प्रतिउत्तरपत्रका तथ्य मिलाउँदै...', 'फिरादीको दाबीको जवाफ बनाउँदै...', 'कानूनी आधार जाँच्दै...'];
  }
  return ['फिरादपत्रका तथ्य मिलाउँदै...', 'मुख्य दाबी र माग छुट्याउँदै...', 'कानूनी आधार जाँच्दै...'];
}

// KaanoonGPT-style saved thinking transcript
function ThinkingBlock({ steps, agentName, role, isActive }) {
  const [open, setOpen] = useState(isActive);
  const usefulSteps = normalizeThoughtSteps(steps, role);
  const isNepali = hasDevanagari(agentName) || usefulSteps.some((step) => hasDevanagari(step));

  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  if (!usefulSteps.length && !isActive) return null;

  return (
    <div className={`thinking-block ${isActive ? 'thinking-block--active' : ''}`} data-role={role}>
      <button className="thinking-toggle" onClick={() => setOpen(o => !o)}>
        <img className="thinking-logo" src="/logo.png" alt="" />
        <span className="thinking-label">
          {isActive
            ? `${agentName} ${isNepali ? 'सोच्दै...' : 'thinking...'}`
            : `${agentName} ${isNepali ? 'सोच' : 'thinking'}`}
        </span>
        <span className="thinking-count">{usefulSteps.length} {isNepali ? 'चरण' : 'steps'}</span>
        <span className="thinking-chevron">{open ? '⌃' : '⌄'}</span>
        {isActive && (
          <span className="thinking-dots">
            <span /><span /><span />
          </span>
        )}
      </button>
      {open && (
        <div className="thinking-content">
          {usefulSteps.map((step, i) => (
            <div key={i} className="thinking-step-line">
              <span className="thinking-step-num" />
              <span className="thinking-step-text">{step}</span>
            </div>
          ))}
          {isActive && (
            <div className="thinking-step-line thinking-step-line--active">
              <span className="thinking-step-num">…</span>
              <span className="thinking-step-text thinking-blink">{isNepali ? 'विश्लेषण गर्दै...' : 'Analyzing...'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Single animated message bubble
function MessageBubble({ msg: rawMsg, isLatest, onDone, instant = false }) {
  const msg = { ...rawMsg, content: cleanRoundContent(rawMsg) };
  const meta = ROLE_META[msg.role] || ROLE_META.plaintiff;
  const isNepali = isNepaliMessage(msg);
  const label = isNepali ? (ROLE_LABELS_NE[msg.role] || meta.label) : meta.label;
  const messageContent = msg.content;
  const shouldAnimate = isLatest && !instant && !msg.history_replay && !msg.streaming && !msg.streamed;
  const { displayed, done } = useTypewriter(shouldAnimate ? messageContent : null, 6);
  const content = shouldAnimate ? displayed : messageContent;

  useEffect(() => {
    if (msg.streaming) return;
    if (!shouldAnimate || done) onDone?.();
  }, [done, msg.streaming, onDone, shouldAnimate]);

  return (
    <div className="msg-wrapper" style={{ alignSelf: meta.align }}>
      <div
        className="msg-bubble"
        style={{ background: meta.bg, borderLeftColor: meta.border }}
      >
        <div className="msg-header">
          <span className="msg-role" style={{ color: meta.color }}>{label}</span>
          {msg.round > 0 && msg.phase !== 'argument_rounds' && <span className="msg-round">{isNepali ? `चरण ${msg.round}` : `Round ${msg.round}`}</span>}
          {msg.type === 'verdict' && msg.winner && (
            <span className="msg-winner">{isNepali ? 'विजेता' : 'Winner'}: {msg.winner}</span>
          )}
          {msg.type === 'evaluation' && <span className="msg-tag">{isNepali ? 'मूल्याङ्कन' : 'Evaluation'}</span>}
        </div>

        {/* Thinking block above content */}
        {msg.thinking_steps?.length > 0 && (
          <ThinkingBlock steps={msg.thinking_steps} agentName={label} role={msg.role} isActive={false} />
        )}

        <div className="msg-content">
          {renderMarkdown(content)}
          {(msg.streaming || (shouldAnimate && content !== msg.content)) && <span className="cursor-blink">▋</span>}
        </div>
      </div>
    </div>
  );
}

function CounterRoundDivider({ round }) {
  return (
    <div className="counter-round-divider">
      <span>Round {round}</span>
    </div>
  );
}

function agentStatusTitle(agentName = '') {
  if (agentName === 'Statement Prep') return 'Statement Prep Agent';
  if (agentName === 'Legal Analysis') return 'Legal Analysis Agent';
  if (agentName === 'Citation Verifier') return 'Citation Verifier';
  if (agentName === 'Verdict Agent') return 'Verdict Writer';
  if (agentName === 'Plaintiff Case Reviewer') return 'Petition Review Agent';
  if (agentName === 'Defendant Case Reviewer') return 'Response Review Agent';
  if (agentName === 'Research Agent') return 'Legal Research Agent';
  return agentName || 'Sub-Agent';
}

function agentStatusAction(work = {}) {
  const phase = work.phase;
  const pipeline = work.pipeline;
  const agent = work.agent_name;

  if (agent === 'Legal Analysis') return 'reviewing both sides and guiding the next stage';
  if (agent === 'Citation Verifier') return 'checking legal references and source support';
  if (agent === 'Verdict Agent') return 'drafting final conclusion';
  if (phase === 'opening_statements') return `preparing ${pipeline} opening statement`;
  if (phase === 'closing_statements') return `preparing ${pipeline} closing statement`;
  if (phase === 'argument_rounds') return pipeline === 'judge'
    ? 'preparing judicial transition'
    : `drafting ${pipeline} counter argument`;
  return 'processing courtroom task';
}

function AgentStatusLine({ work }) {
  const role = ROLE_META[work.pipeline]?.label || work.pipeline || 'Agent';
  const isComplete = work.status === 'complete';

  return (
    <div className={`agent-status-line agent-status-line--${work.pipeline || 'system'}`}>
      <img src="/logo.png" alt="" />
      <div>
        <strong>{agentStatusTitle(work.agent_name)}</strong>
        <span>{role} · {agentStatusAction(work)}</span>
      </div>
      <small>{isComplete ? 'done' : 'working'}</small>
    </div>
  );
}

function phaseLabel(phase = '') {
  return PHASE_LABELS[phase] || phase.replace(/_/g, ' ') || 'Courtroom';
}

function AgentStatusSidebar({ works = [], open, onClose }) {
  if (!open) return null;

  return (
    <div className="agent-status-sidebar">
      <div className="agent-status-sidebar__header">
        <div>
          <span>Agent Status</span>
          <small>{works.length} task{works.length === 1 ? '' : 's'} tracked</small>
        </div>
        <button onClick={onClose} className="citations-close">×</button>
      </div>

      <div className="agent-status-sidebar__list">
        {works.length === 0 && (
          <div className="agent-status-empty">No agent activity yet.</div>
        )}
        {works.map((work, index) => {
          const role = ROLE_META[work.pipeline]?.label || work.pipeline || 'Agent';
          const status = work.status || 'running';
          return (
            <div
              key={`${work.agent_name}-${work.pipeline}-${work.phase}-${work.round}-${index}`}
              className={`agent-status-item agent-status-item--${status}`}
            >
              <div className="agent-status-item__top">
                <img src="/logo.png" alt="" />
                <div>
                  <strong>{agentStatusTitle(work.agent_name)}</strong>
                  <span>{role}</span>
                </div>
                <small>{status}</small>
              </div>
              <div className="agent-status-item__body">
                <div>
                  <span>Phase</span>
                  <strong>{phaseLabel(work.phase)}{work.round > 0 ? ` · Round ${work.round}` : ''}</strong>
                </div>
                <div>
                  <span>Task</span>
                  <strong>{agentStatusAction(work)}</strong>
                </div>
                {work.duration_ms ? (
                  <div>
                    <span>Duration</span>
                    <strong>{(work.duration_ms / 1000).toFixed(1)}s</strong>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
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
  return source?.citation_label || source?.title || source?.name || source?.act_name || source?.case_name || 'Knowledge base source';
}

function formatSourceMeta(source) {
  return source?.relevance_label || source?.section || source?.citation || source?.court || 'verified';
}

function SystemMessage({ content }) {
  return (
    <div className="system-message">
      <div className="system-message__label">System</div>
      <p>{content}</p>
    </div>
  );
}

function StatusMessage({ content }) {
  return (
    <div className="status-message">
      <span>{content}</span>
    </div>
  );
}

function parseStructuredResult(result = '') {
  const lines = String(result || '').split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const title = lines[0].endsWith(':') ? lines[0].slice(0, -1) : lines[0];
  const rows = lines.slice(1).map((line) => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    return match ? { label: match[1].trim(), value: match[2].trim() } : null;
  }).filter(Boolean);
  return rows.length ? { title, rows } : null;
}

function rowValue(rows, label) {
  return rows.find((row) => row.label.toLowerCase() === label.toLowerCase())?.value || '';
}

function thoughtParagraph(result = '', agentTitle = 'Reviewer') {
  const parsed = parseStructuredResult(result);
  if (!parsed) return String(result || '').trim();

  const title = parsed.title.toLowerCase();
  const rows = parsed.rows;

  if (title.includes('petition read')) {
    return `${agentTitle} reviewed the ${rowValue(rows, 'Document') || 'petition'} and confirmed ${rowValue(rows, 'Status') || 'text extraction'}.`;
  }
  if (title.includes('parties identified')) {
    return `${agentTitle} identified ${rowValue(rows, 'Plaintiff')} as the plaintiff and ${rowValue(rows, 'Defendant')} as the defendant. The related issue noted from the filing is ${rowValue(rows, 'Related issue')}.`;
  }
  if (title.includes('claims mapped')) {
    return `The petition was framed as ${rowValue(rows, 'Case type')}, with ${rowValue(rows, 'Primary relief')} as the primary relief and the main issues recorded as ${rowValue(rows, 'Issues')}.`;
  }
  if (title.includes('response read')) {
    return `${agentTitle} reviewed the ${rowValue(rows, 'Document') || 'response'} and confirmed ${rowValue(rows, 'Status') || 'text extraction'}.`;
  }
  if (title.includes('defenses identified')) {
    return `The response records ${rowValue(rows, 'Position')} as the position, ${rowValue(rows, 'Denial')} as the denial, and ${rowValue(rows, 'Counterclaim')} as the counterclaim.`;
  }
  if (title.includes('alignment checked')) {
    return `The response was aligned with the petition through the parties ${rowValue(rows, 'Matched parties')} and the case type ${rowValue(rows, 'Case type')}. Result: ${rowValue(rows, 'Result')}.`;
  }

  return `${parsed.title}: ${rows.map((row) => `${row.label} ${row.value}`).join(', ')}.`;
}

function documentAgentTitle(work = {}) {
  return work.pipeline === 'defendant' ? 'Response Reviewer' : 'Petition Reviewer';
}

function listText(items = [], fallback = 'not clearly extracted') {
  return Array.isArray(items) && items.length ? items.join(', ') : fallback;
}

function getVerifiedSources(message = {}) {
  const laws = Array.isArray(message?.laws) ? message.laws : [];
  const cases = Array.isArray(message?.cases) ? message.cases : [];
  return [...laws.slice(0, 4), ...cases.slice(0, 2)];
}

function caseMatchParagraph(caseAnalysis) {
  if (!caseAnalysis) return '';
  const status = caseAnalysis.matched ? 'passed' : 'needs review';
  const partiesStatus = caseAnalysis.parties_matched ? 'matched' : 'not matched';
  const caseTypeStatus = caseAnalysis.case_type_matched ? 'matched' : 'not matched';
  const parties = listText(caseAnalysis.shared_parties);
  const issues = listText(caseAnalysis.issues, 'not clearly extracted');
  return `Case match ${status}: parties ${partiesStatus}, case type ${caseTypeStatus}. Matched parties: ${parties}. Main issues: ${issues}.`;
}

function researchParagraph(knowledgeCheck) {
  if (!knowledgeCheck) return '';
  const sources = getVerifiedSources(knowledgeCheck);
  if (!sources.length) {
    return 'Knowledge-base retrieval found no verified anchors, so the hearing should stay limited to uploaded facts and explicit legal sources.';
  }
  const sourceNames = sources.map((source, index) => `[${index + 1}] ${formatSourceTitle(source)}`).join('; ');
  return `Knowledge-base retrieval returned ${sources.length} verified reference anchors for the simulation: ${sourceNames}.`;
}

function buildThoughtSummaryLines(caseAnalysis, sources) {
  const lines = [];

  if (caseAnalysis) {
    lines.push('Case match');
    lines.push(caseAnalysis.matched ? 'Passed / सफल' : 'Needs review / समीक्षा चाहिन्छ');
    lines.push('Case type');
    lines.push(caseAnalysis.case_type || 'not identified');
    lines.push('Parties');
    lines.push(listText(caseAnalysis.shared_parties));
    lines.push('Issues');
    lines.push(listText(caseAnalysis.issues, 'not clearly extracted'));
  }

  if (sources.length > 0) {
    lines.push('References');
    sources.forEach((source) => {
      lines.push(`${formatSourceTitle(source)} — ${formatSourceMeta(source)}`);
    });
  }

  return lines;
}

function GeneratedThoughtBody({ paragraphs, caseAnalysis, sources, instant = false, onDone }) {
  const summaryLines = buildThoughtSummaryLines(caseAnalysis, sources);
  const fullText = [...paragraphs, ...summaryLines].join('\n\n');
  const { displayed, done } = useTypewriter(fullText, 10);
  const isDone = instant || done;
  const visibleText = instant ? fullText : displayed;
  const visibleBlocks = visibleText.split('\n\n').filter(Boolean);
  const displayedParagraphs = visibleBlocks.slice(0, paragraphs.length);
  const displayedSummaryLines = visibleBlocks.slice(paragraphs.length);

  useEffect(() => {
    if (isDone) onDone?.();
  }, [isDone, onDone]);

  return (
    <div className="document-thought__body">
      <div className="document-thought__generated">
        {displayedParagraphs.map((paragraph, index) => (
          <p key={`${paragraph}-${index}`}>{paragraph}</p>
        ))}
        {!isDone && <span className="cursor-blink">▋</span>}
      </div>

      {displayedSummaryLines.length > 0 && caseAnalysis && (
        <div className="document-thought__summary">
          {displayedSummaryLines.length > 0 && (
            <div>
            <span>Case match</span>
              <strong>{displayedSummaryLines[1] || ''}</strong>
            </div>
          )}
          {displayedSummaryLines.length > 2 && (
            <div>
              <span>Case type</span>
              <strong>{displayedSummaryLines[3] || ''}</strong>
            </div>
          )}
          {displayedSummaryLines.length > 4 && (
            <div>
              <span>Parties</span>
              <strong>{displayedSummaryLines[5] || ''}</strong>
            </div>
          )}
          {displayedSummaryLines.length > 6 && (
            <div>
              <span>Issues</span>
              <strong>{displayedSummaryLines[7] || ''}</strong>
            </div>
          )}
        </div>
      )}

      {displayedSummaryLines.length > 8 && sources.length > 0 && (
        <div className="document-thought__references">
          <span>References</span>
          <ol>
            {displayedSummaryLines.slice(9).map((line, index) => {
              const [title, meta = ''] = line.split(' — ');
              return (
              <li key={`${line}-${index}`}>
                <strong>{title}</strong>
                <small>{meta}</small>
              </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function DocumentIntakeThought({ works = [], caseAnalysis, knowledgeCheck, onReady, instant = false }) {
  const [open, setOpen] = useState(true);
  const [generatedDone, setGeneratedDone] = useState(Boolean(instant));
  const sources = getVerifiedSources(knowledgeCheck);
  const hasRunningWork = works.some((work) => work.status === 'running');
  const isThinking = !instant && (hasRunningWork || !caseAnalysis || !knowledgeCheck);
  const durationSeconds = Math.max(
    23,
    Math.round((works.reduce((sum, work) => sum + (work.duration_ms || 0), 0) || 23000) / 1000)
  );
  const paragraphs = [
    ...works.flatMap((work) => (
      (work.thinking_results || []).map((result) => thoughtParagraph(result, documentAgentTitle(work))).filter(Boolean)
    )),
    caseMatchParagraph(caseAnalysis),
    researchParagraph(knowledgeCheck),
  ].filter(Boolean);
  const paragraphKey = paragraphs.join('\n\n');
  const showThinking = isThinking || (!instant && !generatedDone);

  useEffect(() => {
    setGeneratedDone(Boolean(instant));
  }, [paragraphKey, instant]);

  useEffect(() => {
    if (!onReady) return;
    onReady(!showThinking);
  }, [showThinking, onReady]);

  if (!isThinking && !paragraphs.length) return null;

  function handleThoughtToggle() {
    if (open && !isThinking) setGeneratedDone(true);
    setOpen((value) => !value);
  }

  return (
    <div className={`document-thought ${showThinking ? 'document-thought--thinking' : ''}`}>
      <button type="button" className="document-thought__header" onClick={handleThoughtToggle}>
        <img className="document-thought__logo" src="/logo.png" alt="" />
        <span>{showThinking ? 'Thinking' : `Thought for ${durationSeconds} seconds`}</span>
        {showThinking && (
          <span className="document-thought__loading" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
        {open ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
      </button>
      {open && !isThinking && (
        <GeneratedThoughtBody
          paragraphs={paragraphs}
          caseAnalysis={caseAnalysis}
          sources={sources}
          instant={instant || generatedDone}
          onDone={() => setGeneratedDone(true)}
        />
      )}
    </div>
  );
}

function KnowledgeBaseCheck({ msg }) {
  const laws = msg.laws || [];
  const cases = msg.cases || [];
  const verifiedSources = [...laws.slice(0, 4), ...cases.slice(0, 2)];
  const isNepali = verifiedSources.some((source) => hasDevanagari(formatSourceTitle(source)) || hasDevanagari(formatSourceMeta(source)));

  return (
    <div className="kb-check-card kb-check-card--links">
      <div className="kb-check-card__label">{isNepali ? 'Knowledge Base / ज्ञानभण्डार' : 'Knowledge Base Check'}</div>
      {verifiedSources.length > 0 ? (
        <>
          <div className="kb-check-card__summary">
            {isNepali ? `${verifiedSources.length} verified sources / प्रमाणित स्रोत` : `Found ${verifiedSources.length} verified sources`}
          </div>
          <ul>
          {verifiedSources.map((source, index) => (
            <li key={`${formatSourceTitle(source)}-${index}`}>
              <button type="button" className="kb-source-link">
                <span>{formatSourceTitle(source)}</span>
                <small>{formatSourceMeta(source)}</small>
              </button>
            </li>
          ))}
          </ul>
        </>
      ) : (
        <p>{isNepali ? 'प्रमाणित कानून वा नजिर भेटिएन। एजेन्टहरूले अपलोड गरिएका कागजातमा मात्र भर पर्नेछन्।' : 'No verified statutes or cases were found. Agents will rely only on the uploaded documents.'}</p>
      )}
    </div>
  );
}

function CaseAnalysis({ msg }) {
  const isNepali = isNepaliMessage(msg);
  const status = msg.matched ? 'Matched' : 'Not matched';
  const parties = msg.shared_parties?.length ? msg.shared_parties : ['पक्षहरू स्पष्ट रूपमा मिलेनन्'];
  const issues = msg.issues?.length ? msg.issues : ['मुख्य प्रश्न कागजातबाट स्पष्ट भएन'];

  return (
    <div className={`case-analysis ${msg.matched ? 'case-analysis--matched' : 'case-analysis--mismatch'}`}>
      <div className="case-analysis__top">
        <div>
          <div className="case-analysis__label">Case Match Analysis</div>
          <div className="case-analysis__summary">
            <strong>{isNepali ? (msg.matched ? 'मिलेको' : 'नमिलेको') : status}</strong>
            <span>{msg.case_type || 'मुद्दाको प्रकार अज्ञात'}</span>
          </div>
        </div>
        <span className="case-analysis__status">{isNepali ? (msg.matched ? 'Passed / सफल' : 'Stopped / रोकियो') : (msg.matched ? 'Check passed' : 'Trial stopped')}</span>
      </div>
      <div className="case-analysis__checks">
        <span data-ok={msg.parties_matched ? 'true' : 'false'}>
          {isNepali ? 'Parties / पक्ष' : 'Parties'}: {isNepali ? (msg.parties_matched ? 'matched / मिलेका' : 'not matched / नमिलेका') : (msg.parties_matched ? 'matched' : 'not matched')}
        </span>
        <span data-ok={msg.case_type_matched ? 'true' : 'false'}>
          {isNepali ? 'Case type / मुद्दा' : 'Case type'}: {isNepali ? (msg.case_type_matched ? 'matched / मिलेको' : 'not matched / नमिलेको') : (msg.case_type_matched ? 'matched' : 'not matched')}
        </span>
      </div>
      <div className="case-analysis__grid">
        <div>
          <span>{isNepali ? 'Matched parties / पक्षहरू' : 'Matched parties'}</span>
          <p>{parties.join(', ')}</p>
        </div>
        <div>
          <span>{isNepali ? 'Main issues / मुख्य विषय' : 'Main issues'}</span>
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
  onReplay,
  historyReplay = false,
}) {
  const effectiveHistoryReplay = historyReplay || session?.status !== 'in_progress';
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [agentStatusOpen, setAgentStatusOpen] = useState(false);
  const [researchData, setResearchData] = useState({ laws: [], cases: [] });
  const [pretrialThoughtReady, setPretrialThoughtReady] = useState(false);
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);

  useEffect(() => {
    if (effectiveHistoryReplay) {
      messagesRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [effectiveHistoryReplay, messages, visibleMessageCount]);

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
  const hasRenderableMessages = renderableMessages.length > 0;
  const showCompletedEmptyState = trialComplete && !hasRenderableMessages && !error;
  const isPaused = session?.status === 'paused';
  const showPausedBanner = isPaused && !trialComplete && !effectiveHistoryReplay;
  const chatViewClassName = `chat-view ${showCompletedEmptyState ? 'chat-view--completed-empty' : ''}`;
  const documentThoughtWorks = messages.filter((message) => message.type === 'agent_work' && message.phase === 'document_review');
  const caseAnalysisMessage = messages.find((message) => message.type === 'case_analysis');
  const knowledgeCheckMessage = messages.find((message) => message.type === 'kb_check' || message.type === 'research_complete');
  const pretrialThoughtIndex = messages.findIndex((message) => (
    (message.type === 'agent_work' && message.phase === 'document_review') ||
    message.type === 'case_analysis' ||
    message.type === 'kb_check' ||
    message.type === 'research_complete'
  ));
  const pretrialThoughtKey = [
    session?.id || '',
    documentThoughtWorks.map((work) => `${work.pipeline}:${work.agent_name}:${work.status}:${work.duration_ms || 0}`).join('|'),
    caseAnalysisMessage ? 'case-analysis' : '',
    knowledgeCheckMessage ? 'knowledge-check' : '',
  ].join('::');
  const currentVisibleIndex = visibleMessageCount - 1;
  const currentVisibleMessage = currentVisibleIndex >= 0 ? messages[currentVisibleIndex] : null;
  const visualPlaybackComplete = messages.length > 0 && visibleMessageCount > messages.length;
  const visibleAgentWorks = messages
    .slice(0, Math.min(visibleMessageCount, messages.length))
    .filter((message) => message.type === 'agent_work');

  useEffect(() => {
    setPretrialThoughtReady(effectiveHistoryReplay || pretrialThoughtIndex === -1);
  }, [effectiveHistoryReplay, pretrialThoughtIndex, pretrialThoughtKey]);

  useEffect(() => {
    setVisibleMessageCount(effectiveHistoryReplay ? messages.length + 1 : 0);
  }, [effectiveHistoryReplay, session?.id]);

  useEffect(() => {
    if (!messages.length) {
      setVisibleMessageCount(0);
      return;
    }
    if (effectiveHistoryReplay) {
      setVisibleMessageCount(messages.length + 1);
      return;
    }
    setVisibleMessageCount((count) => {
      if (count <= 0) return 1;
      return Math.min(count, messages.length);
    });
  }, [effectiveHistoryReplay, messages.length]);

  useEffect(() => {
    if (effectiveHistoryReplay) return;
    if (!currentVisibleMessage) return;

    const type = currentVisibleMessage.type;
    const isHiddenPhase = type === 'phase_start' && ['document_review', 'research'].includes(currentVisibleMessage.phase);
    const isRedundantPretrialEvent = (
      pretrialThoughtIndex !== -1 &&
      pretrialThoughtReady &&
      currentVisibleIndex > pretrialThoughtIndex &&
      (
        (type === 'agent_work' && currentVisibleMessage.phase === 'document_review') ||
        type === 'case_analysis' ||
        type === 'kb_check' ||
        type === 'research_complete'
      )
    );
    const hasLiveStatementStream = (
      type === 'agent_work' &&
      currentVisibleMessage.agent_name === 'Statement Prep' &&
      messages.slice(currentVisibleIndex + 1).some((message) => (
        message.type === 'argument' &&
        message.streaming &&
        message.role === currentVisibleMessage.pipeline &&
        message.phase === currentVisibleMessage.phase &&
        message.round === currentVisibleMessage.round
      ))
    );
    const shouldAutoAdvance = (
      isHiddenPhase ||
      isRedundantPretrialEvent ||
      hasLiveStatementStream ||
      (type === 'agent_work' && currentVisibleMessage.phase === 'argument_rounds') ||
      type === 'status' ||
      type === 'system' ||
      type === 'sub_agent_error' ||
      type === 'trial_error' ||
      (type === 'phase_start' && !isHiddenPhase)
    );

    if (!shouldAutoAdvance) return;

    const delay = type === 'phase_start' && !isHiddenPhase
      ? 450
      : hasLiveStatementStream
        ? 40
      : (type === 'agent_work' && currentVisibleMessage.phase === 'argument_rounds')
        ? 650
        : 80;
    const timer = window.setTimeout(() => {
      markVisibleItemDone(currentVisibleIndex);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [effectiveHistoryReplay, currentVisibleIndex, currentVisibleMessage, messages, pretrialThoughtIndex, pretrialThoughtReady]);

  function markVisibleItemDone(index) {
    setVisibleMessageCount((count) => {
      if (index !== count - 1) return count;
      return Math.min(messages.length + 1, count + 1);
    });
  }

  function renderPretrialThought(index) {
    const isCurrentItem = index === currentVisibleIndex;
    return (
          <DocumentIntakeThought
            key="pretrial-thought"
            works={documentThoughtWorks}
            caseAnalysis={caseAnalysisMessage}
            knowledgeCheck={knowledgeCheckMessage}
            instant={effectiveHistoryReplay}
            onReady={isCurrentItem
          ? (ready) => {
              setPretrialThoughtReady(ready);
              if (ready) markVisibleItemDone(index);
            }
          : undefined}
      />
    );
  }

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
          {onReplay && (
            <button className="btn-replay" onClick={onReplay} title="Replay mock session">
              Replay
            </button>
          )}
          <button className="btn-agent-status" onClick={() => setAgentStatusOpen(true)}>
            Agent Status
          </button>
          <button className="btn-citations" onClick={() => setCitationsOpen(true)}>Citations</button>
          {!trialComplete && !isPaused && onStop && (
            <button className="btn-stop" onClick={onStop} title="Stop session">
              Stop
            </button>
          )}
          {trialComplete && (
            <button
              className="btn-download"
              onClick={downloadTranscript}
              disabled={!hasRenderableMessages}
              title={hasRenderableMessages ? 'Download transcript' : 'No transcript messages saved'}
            >
              Transcript
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={messagesRef}>
        {messages.map((msg, i) => {
          if (i >= visibleMessageCount) {
            return null;
          }

          if (pretrialThoughtIndex !== -1 && !pretrialThoughtReady && i > pretrialThoughtIndex) {
            return null;
          }

          if (msg.type === 'phase_start') {
            if (msg.phase === 'document_review' || msg.phase === 'research') {
              return null;
            }
            if (
              msg.phase === 'argument_rounds' &&
              messages.findIndex((message) => message.type === 'phase_start' && message.phase === 'argument_rounds') !== i
            ) {
              return null;
            }
            const labels = isNepaliMessage(msg) ? PHASE_LABELS_NE : PHASE_LABELS;
            return (
              <div key={i} className="phase-divider">
                <span>{labels[msg.phase] || msg.phase}</span>
              </div>
            );
          }
          if (msg.type === 'research_complete' && pretrialThoughtIndex !== -1) {
            return i === pretrialThoughtIndex
              ? renderPretrialThought(i)
              : null;
          }
          if (msg.type === 'research_complete') {
            const isNepali = hasDevanagari(msg.content) || (msg.laws || []).some((law) => hasDevanagari(formatSourceTitle(law)));
            return (
              <div key={i} className="research-banner">
                {isNepali
                  ? `Research complete / अनुसन्धान सकियो — ${msg.laws_count} laws · ${msg.cases_count} cases`
                  : `Research complete — ${msg.laws_count} statutes · ${msg.cases_count} cases`}
              </div>
            );
          }
          if (msg.type === 'system') {
            return <SystemMessage key={i} content={msg.content} />;
          }
          if (msg.type === 'status') {
            return <StatusMessage key={i} content={msg.content} />;
          }
          if (msg.type === 'kb_check') {
            return i === pretrialThoughtIndex
              ? renderPretrialThought(i)
              : null;
          }
          if (msg.type === 'case_analysis') {
            return i === pretrialThoughtIndex
              ? renderPretrialThought(i)
              : null;
          }
          if (msg.type === 'agent_work') {
            if (msg.phase === 'document_review') {
              return i === pretrialThoughtIndex
                ? renderPretrialThought(i)
                : null;
            }
            if (!effectiveHistoryReplay && msg.phase === 'argument_rounds') {
              return <AgentStatusLine key={i} work={msg} />;
            }
            return (
              <SubAgentProgress
                key={i}
                work={msg}
                instant={effectiveHistoryReplay || msg.history_replay}
                onReady={i === currentVisibleIndex ? () => markVisibleItemDone(i) : undefined}
              />
            );
          }
          if (msg.type === 'sub_agent_error') {
            return (
              <div key={i} className="sub-agent-error-msg">
                <strong>{msg.pipeline} → {msg.agent_name}</strong>: {msg.content}
              </div>
            );
          }
          if (msg.type === 'trial_error') {
            return (
              <div key={i} className="trial-error">
                {msg.content}
              </div>
            );
          }
          if (['argument', 'evaluation', 'verdict'].includes(msg.type)) {
            const showCounterRoundDivider = (
              msg.phase === 'argument_rounds' &&
              msg.round > 0 &&
              !messages.slice(0, i).some((message) => (
                ['argument', 'evaluation'].includes(message.type) &&
                message.phase === 'argument_rounds' &&
                message.round === msg.round
              ))
            );
            return (
              <div key={i} className="counter-round-item">
                {showCounterRoundDivider && <CounterRoundDivider round={msg.round} />}
                <MessageBubble
                  msg={msg}
                  isLatest={i === currentVisibleIndex}
                  instant={effectiveHistoryReplay || msg.history_replay}
                  onDone={i === currentVisibleIndex ? () => markVisibleItemDone(i) : undefined}
                />
              </div>
            );
          }
          return null;
        })}

        {error && (
          <div className="trial-error">
            {error}
            {onRetry && (
              <button className="btn-retry" onClick={onRetry}>Retry</button>
            )}
          </div>
        )}
        {trialComplete && visualPlaybackComplete && <div className="trial-complete-banner">Session Complete</div>}
        {showPausedBanner && <div className="session-paused-banner">Session Paused</div>}
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
      <AgentStatusSidebar
        works={visibleAgentWorks}
        open={agentStatusOpen}
        onClose={() => setAgentStatusOpen(false)}
      />
    </div>
  );
}
