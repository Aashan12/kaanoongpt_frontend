'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, BookOpen, X } from 'lucide-react';
import './chat-trial.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

function getPhaseLabel(phase, round, numRounds) {
  switch (phase) {
    case 'research': return '📚 Research Phase';
    case 'opening_statements': return '📜 Opening Statements';
    case 'argument_rounds': return `⚔️ Round ${round} of ${numRounds}`;
    case 'closing_statements': return '📝 Closing Statements';
    case 'verdict': return '⚖️ Verdict';
    case 'complete': return '✅ Trial Complete';
    default: return '🔄 Starting...';
  }
}

function getAgentColor(agent) {
  switch (agent) {
    case 'plaintiff': return '#3b82f6';
    case 'defendant': return '#ef4444';
    case 'judge': return '#f59e0b';
    default: return '#94a3b8';
  }
}

function getAgentIcon(agent) {
  switch (agent) {
    case 'plaintiff': return '🔵';
    case 'defendant': return '🔴';
    case 'judge': return '⚖️';
    default: return '📋';
  }
}

export default function ChatTrial({ config, onBack }) {
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('connecting');
  const [round, setRound] = useState(0);
  const [trialId, setTrialId] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [winner, setWinner] = useState('');
  const [error, setError] = useState('');
  const [citations, setCitations] = useState([]);
  const [showCitations, setShowCitations] = useState(false);
  const [lawsCount, setLawsCount] = useState(0);
  const [casesCount, setCasesCount] = useState(0);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to WebSocket and run trial
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket(`${WS_BASE_URL}/api/courtroom/ws/trial`);
      wsRef.current = ws;

      ws.onopen = () => {
        setPhase('setup');
        addSystemMessage('Connecting to courtroom...');
        // Send trial config
        ws.send(JSON.stringify(config));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleTrialEvent(data);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error. Falling back to REST API...');
        // Fallback to REST
        runTrialREST();
      };

      ws.onclose = () => {
        if (!isComplete) {
          // Unexpected close — might need REST fallback
        }
      };
    } catch (e) {
      console.error('WebSocket failed:', e);
      runTrialREST();
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      type: 'system',
      content: text,
      timestamp: new Date(),
    }]);
  };

  const addAgentMessage = (agent, content, eventPhase, eventRound) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      type: 'agent',
      agent,
      content,
      phase: eventPhase,
      round: eventRound,
      timestamp: new Date(),
    }]);
  };

  const handleTrialEvent = (event) => {
    switch (event.type) {
      case 'trial_started':
        setTrialId(event.trial_id);
        addSystemMessage(`Trial ${event.trial_id} initiated.`);
        break;

      case 'phase_start':
        setPhase(event.phase);
        if (event.round) setRound(event.round);
        addSystemMessage(event.content);
        break;

      case 'research_complete':
        setLawsCount(event.laws_count || 0);
        setCasesCount(event.cases_count || 0);
        addSystemMessage(event.content);
        break;

      case 'argument':
        addAgentMessage(event.agent, event.content, event.phase, event.round);
        break;

      case 'evaluation':
        addAgentMessage(event.agent, event.content, event.phase, event.round);
        break;

      case 'verdict':
        setPhase('verdict');
        setWinner(event.winner || '');
        addAgentMessage('judge', event.content, 'verdict', 0);
        break;

      case 'trial_complete':
        setIsComplete(true);
        setPhase('complete');
        // Extract citations from state if available
        if (event.state) {
          const allCitations = [
            ...(event.state.relevant_laws || []).map(l => ({ ...l, type: 'law' })),
            ...(event.state.relevant_cases || []).map(c => ({ ...c, type: 'case' })),
          ];
          setCitations(allCitations);
        }
        break;

      case 'error':
        setError(event.content);
        addSystemMessage(`Error: ${event.content}`);
        break;

      default:
        break;
    }
  };

  // REST fallback if WebSocket fails
  const runTrialREST = async () => {
    setError('');
    setPhase('setup');
    addSystemMessage('Starting trial via REST API...');

    try {
      const res = await fetch(`${API_BASE_URL}/api/courtroom/trial/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTrialId(data.trial_id);

      // Replay events from REST response
      if (data.events) {
        for (const event of data.events) {
          handleTrialEvent(event);
          // Small delay for visual effect
          await new Promise(r => setTimeout(r, 200));
        }
      }

      // Also add messages from state
      if (data.messages && data.messages.length > 0) {
        for (const msg of data.messages) {
          addAgentMessage(msg.role, msg.content, msg.phase || '', msg.round || 0);
        }
      }

      setIsComplete(true);
      setPhase('complete');
      setWinner(data.winner || '');
    } catch (e) {
      setError(e.message);
      addSystemMessage(`Trial failed: ${e.message}`);
    }
  };

  const downloadTranscript = () => {
    const lines = messages.map(msg => {
      if (msg.type === 'system') return `[SYSTEM] ${msg.content}`;
      const label = msg.agent ? msg.agent.toUpperCase() : 'UNKNOWN';
      return `[${label}] ${msg.content}`;
    });

    const text = `COURTROOM TRIAL TRANSCRIPT\n${'='.repeat(60)}\n\nCase: ${config.case_title}\nType: ${config.case_type}\nPlaintiff: ${config.plaintiff_name}\nDefendant: ${config.defendant_name}\nRounds: ${config.num_rounds}\nDate: ${new Date().toLocaleDateString()}\n\n${'='.repeat(60)}\n\n${lines.join('\n\n')}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial_${config.case_title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="chat-trial-wrapper">
      {/* Citations sidebar */}
      {showCitations && (
        <div className="citations-sidebar">
          <div className="citations-sidebar-header">
            <h3>📚 Legal References</h3>
            <button onClick={() => setShowCitations(false)} className="citations-close">
              <X size={18} />
            </button>
          </div>
          <div className="citations-sidebar-content">
            {lawsCount > 0 && (
              <div className="citations-group">
                <h4>Statutes ({lawsCount})</h4>
                {citations.filter(c => c.type === 'law').map((c, i) => (
                  <div key={i} className="citation-card-sm">
                    <span className="citation-badge law">LAW</span>
                    <span className="citation-title-sm">{c.title || c.document || `Statute ${i + 1}`}</span>
                  </div>
                ))}
              </div>
            )}
            {casesCount > 0 && (
              <div className="citations-group">
                <h4>Case Precedents ({casesCount})</h4>
                {citations.filter(c => c.type === 'case').map((c, i) => (
                  <div key={i} className="citation-card-sm">
                    <span className="citation-badge case">CASE</span>
                    <span className="citation-title-sm">{c.title || c.document || `Case ${i + 1}`}</span>
                  </div>
                ))}
              </div>
            )}
            {citations.length === 0 && (
              <p className="no-citations">Citations will appear as the trial progresses.</p>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="chat-trial-container">
        <div className="chat-trial-header">
          <button onClick={onBack} className="chat-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="header-center">
            <h1>{config.case_title}</h1>
            <div className="header-meta">
              <span className="meta-tag">{config.case_type}</span>
              <span className="meta-tag">{config.plaintiff_name} v. {config.defendant_name}</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="chat-round-indicator">
              {getPhaseLabel(phase, round, config.num_rounds)}
            </div>
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="btn-citations"
              title="View legal references"
            >
              <BookOpen size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="trial-error-bar">
            <span>{error}</span>
          </div>
        )}

        <div className="chat-messages">
          {messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="chat-message chat-system">
                  <div className="system-bubble">
                    {msg.content}
                  </div>
                </div>
              );
            }

            const agentClass = `chat-${msg.agent || 'system'}`;
            return (
              <div key={msg.id} className={`chat-message ${agentClass}`}>
                <div className="chat-avatar">
                  {getAgentIcon(msg.agent)}
                </div>
                <div className="chat-bubble">
                  <div className="chat-speaker" style={{ color: getAgentColor(msg.agent) }}>
                    {msg.agent === 'plaintiff' && config.plaintiff_name + ' (Plaintiff Attorney)'}
                    {msg.agent === 'defendant' && config.defendant_name + ' (Defense Attorney)'}
                    {msg.agent === 'judge' && 'Judge'}
                  </div>
                  <div className="chat-text">{msg.content}</div>
                  <div className="chat-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator when trial is running */}
          {!isComplete && !error && (
            <div className="chat-message chat-system">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom bar */}
        {isComplete && (
          <div className="trial-complete-bar">
            <div className="complete-info">
              {winner && <span className="winner-badge">Winner: {winner}</span>}
              <span className="complete-label">Trial Complete</span>
            </div>
            <div className="complete-actions">
              <button onClick={downloadTranscript} className="btn-download">
                <Download size={16} />
                Download Transcript
              </button>
              <button onClick={onBack} className="btn-new-trial">
                New Trial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
