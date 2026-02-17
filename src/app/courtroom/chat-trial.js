'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, ChevronDown, ChevronUp } from 'lucide-react';
import './chat-trial.css';

const JUDGE_NAMES = ['Judge Morrison', 'Judge Chen', 'Judge Williams', 'Judge Rodriguez', 'Judge Thompson'];

function getRandomName(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function StreamingText({ text, isStreaming }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text, isStreaming]);

  return <div className="chat-text">{displayedText}</div>;
}

function ThinkingProcess({ analysis, speaker }) {
  const [expanded, setExpanded] = useState(false);

  if (!analysis) return null;

  return (
    <div className="thinking-process">
      <button
        className="thinking-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="thinking-icon">💭</span>
        <span className="thinking-label">{speaker} is thinking...</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="thinking-content">
          {analysis.case_analysis && (
            <div className="thinking-section">
              <h4>Case Analysis</h4>
              <p>{analysis.case_analysis}</p>
            </div>
          )}
          {analysis.precedent_research && (
            <div className="thinking-section">
              <h4>Precedent Research</h4>
              <p>{analysis.precedent_research}</p>
            </div>
          )}
          {analysis.legal_arguments && (
            <div className="thinking-section">
              <h4>Legal Arguments</h4>
              {Array.isArray(analysis.legal_arguments) ? (
                <ul>
                  {analysis.legal_arguments.map((arg, idx) => (
                    <li key={idx}>{arg}</li>
                  ))}
                </ul>
              ) : (
                <p>{analysis.legal_arguments}</p>
              )}
            </div>
          )}
          {analysis.evidence_evaluation && (
            <div className="thinking-section">
              <h4>Evidence Evaluation</h4>
              <p>{analysis.evidence_evaluation}</p>
            </div>
          )}
          {analysis.strategy && (
            <div className="thinking-section">
              <h4>Strategy</h4>
              <p>{analysis.strategy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VerdictReport({ verdict, caseTitle, onClose }) {
  const downloadReport = () => {
    const reportText = `
COURT VERDICT REPORT
═══════════════════════════════════════════════════════════════

CASE: ${caseTitle}
JUDGE: ${verdict.judge}
DATE: ${new Date().toLocaleDateString()}

───────────────────────────────────────────────────────────────
VERDICT
───────────────────────────────────────────────────────────────

Decision: ${verdict.verdict}
Damages Awarded: ${verdict.damages}
Confidence Score: ${(verdict.confidence * 100).toFixed(1)}%

───────────────────────────────────────────────────────────────
REASONING
───────────────────────────────────────────────────────────────

${verdict.reasoning}

───────────────────────────────────────────────────────────────
CITATIONS & PRECEDENTS
───────────────────────────────────────────────────────────────

${verdict.citations.map((cite, idx) => `${idx + 1}. ${cite.title} (${cite.category})`).join('\n')}

───────────────────────────────────────────────────────────────
ANALYSIS
───────────────────────────────────────────────────────────────

Plaintiff Strength: ${verdict.plaintiff_strength}%
Defendant Strength: ${verdict.defendant_strength}%
Evidence Quality: ${verdict.evidence_quality}%

═══════════════════════════════════════════════════════════════
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
    element.setAttribute('download', `verdict_${caseTitle.replace(/\s+/g, '_')}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="verdict-report-overlay">
      <div className="verdict-report">
        <button onClick={onClose} className="report-close">✕</button>

        <div className="report-header">
          <h2>COURT VERDICT REPORT</h2>
          <p className="report-case">{caseTitle}</p>
        </div>

        <div className="report-section">
          <h3>VERDICT</h3>
          <div className="verdict-box">
            <div className="verdict-item">
              <span className="label">Decision:</span>
              <span className="value">{verdict.verdict}</span>
            </div>
            <div className="verdict-item">
              <span className="label">Damages:</span>
              <span className="value">{verdict.damages}</span>
            </div>
            <div className="verdict-item">
              <span className="label">Confidence Score:</span>
              <span className="value confidence">{(verdict.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3>REASONING</h3>
          <p className="reasoning-text">{verdict.reasoning}</p>
        </div>

        <div className="report-section">
          <h3>CITATIONS & PRECEDENTS</h3>
          <div className="citations-list">
            {verdict.citations.map((cite, idx) => (
              <div key={idx} className="citation-item">
                <span className="citation-number">[{idx + 1}]</span>
                <div className="citation-content">
                  <strong>{cite.title}</strong>
                  <p>{cite.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h3>ANALYSIS METRICS</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Plaintiff Strength</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${verdict.plaintiff_strength}%` }}></div>
              </div>
              <span className="metric-value">{verdict.plaintiff_strength}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Defendant Strength</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${verdict.defendant_strength}%` }}></div>
              </div>
              <span className="metric-value">{verdict.defendant_strength}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Evidence Quality</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${verdict.evidence_quality}%` }}></div>
              </div>
              <span className="metric-value">{verdict.evidence_quality}%</span>
            </div>
          </div>
        </div>

        <div className="report-footer">
          <button onClick={downloadReport} className="download-btn">
            <Download size={18} />
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatTrial({ trialData, onBack }) {
  const [messages, setMessages] = useState([]);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [trialPhase, setTrialPhase] = useState('loading');
  const [round, setRound] = useState(0);
  const [verdictData, setVerdictData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const messageIdRef = useRef(0);
  const trialStartedRef = useRef(false);

  const judgeName = useRef(getRandomName(JUDGE_NAMES)).current;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessageId]);

  useEffect(() => {
    if (trialStartedRef.current) return;
    trialStartedRef.current = true;

    const runTrial = async () => {
      try {
        setTrialPhase('preparation');
        await runPreparationPhase();

        setTrialPhase('trial');
        await runTrialPhase();

        setTrialPhase('verdict');
        await runVerdictPhase();
      } catch (error) {
        console.error('Trial error:', error);
        addMessage('System', 'error', `Error during trial: ${error.message}`);
      }
    };

    runTrial();
  }, []);

  const addMessage = (speaker, role, text, analysis = null) => {
    const msgId = messageIdRef.current++;
    setMessages(prev => [...prev, {
      id: msgId,
      speaker,
      role,
      text,
      analysis,
      timestamp: new Date(),
    }]);
    return msgId;
  };

  const addStreamingMessage = async (speaker, role, text, analysis = null) => {
    const msgId = addMessage(speaker, role, text, analysis);
    setStreamingMessageId(msgId);

    await new Promise(resolve => setTimeout(resolve, text.length * 15 + 300));

    setStreamingMessageId(null);
    return msgId;
  };

  const runPreparationPhase = async () => {
    await addStreamingMessage(
      judgeName,
      'judge',
      `Good morning. We are here today to address the matter of ${trialData.case_title}. I am ${judgeName}, presiding over this case. Let me allow the counsels time to prepare their arguments.`
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    const plaintiffAnalysis = trialData.plaintiff_analysis;
    const plaintiffPrepMsg = addMessage('Plaintiff', 'plaintiff', 'Reviewing case documents and precedents...', plaintiffAnalysis);
    setStreamingMessageId(plaintiffPrepMsg);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStreamingMessageId(null);

    setMessages(prev => prev.map(msg =>
      msg.id === plaintiffPrepMsg ? {
        ...msg,
        text: 'Analyzing legal precedents and preparing opening statement...'
      } : msg
    ));
    await new Promise(resolve => setTimeout(resolve, 2000));

    setMessages(prev => prev.map(msg =>
      msg.id === plaintiffPrepMsg ? {
        ...msg,
        text: 'Ready to present opening statement.'
      } : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    const defendantAnalysis = trialData.defendant_analysis;
    const defendantPrepMsg = addMessage('Defendant', 'defendant', 'Reviewing case documents and precedents...', defendantAnalysis);
    setStreamingMessageId(defendantPrepMsg);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStreamingMessageId(null);

    setMessages(prev => prev.map(msg =>
      msg.id === defendantPrepMsg ? {
        ...msg,
        text: 'Analyzing legal precedents and preparing defense statement...'
      } : msg
    ));
    await new Promise(resolve => setTimeout(resolve, 2000));

    setMessages(prev => prev.map(msg =>
      msg.id === defendantPrepMsg ? {
        ...msg,
        text: 'Ready to present defense statement.'
      } : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const runTrialPhase = async () => {
    // ROUND 1: Opening Statements
    setRound(1);

    const plaintiffStatement = trialData.plaintiff_analysis?.opening_statement ||
      'Your Honor, the plaintiff respectfully submits that the defendant breached their contractual obligations.';

    await addStreamingMessage(
      'Plaintiff',
      'plaintiff',
      plaintiffStatement,
      trialData.plaintiff_analysis
    );

    await new Promise(resolve => setTimeout(resolve, 1500));

    const defendantStatement = trialData.defendant_analysis?.opening_statement ||
      'Your Honor, the defendant respectfully denies the plaintiff\'s allegations.';

    const defendantReviewMsg = addMessage('Defendant', 'defendant', 'Reviewing plaintiff\'s statement and preparing response...', trialData.defendant_analysis);
    setStreamingMessageId(defendantReviewMsg);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStreamingMessageId(null);

    setMessages(prev => prev.map(msg =>
      msg.id === defendantReviewMsg ? {
        ...msg,
        text: defendantStatement
      } : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // ROUND 2: Judge Questions and Rebuttals
    setRound(2);

    await addStreamingMessage(
      judgeName,
      'judge',
      `Plaintiff, can you elaborate on your evidence and explain how the precedents support your damages claim?`
    );

    await new Promise(resolve => setTimeout(resolve, 1200));

    const plaintiffRebuttal = trialData.plaintiff_analysis?.legal_arguments?.[0] ||
      `Your Honor, the evidence clearly demonstrates that the defendant's breach caused substantial damages. The precedents we've reviewed consistently support our position. We have documented proof of the defendant's failure to perform, and the damages requested are reasonable and well-justified based on comparable cases.`;

    await addStreamingMessage('Plaintiff', 'plaintiff', plaintiffRebuttal);

    await new Promise(resolve => setTimeout(resolve, 1500));

    await addStreamingMessage(
      judgeName,
      'judge',
      `Defendant, how do you respond to the plaintiff's evidence and the precedents cited?`
    );

    await new Promise(resolve => setTimeout(resolve, 1200));

    const defendantRebuttal = trialData.defendant_analysis?.legal_arguments?.[0] ||
      `Your Honor, the plaintiff's evidence is circumstantial and does not meet the legal threshold for material breach. We acted in good faith throughout this matter and made reasonable efforts to fulfill our obligations. The damages claimed are speculative and not supported by documented losses.`;

    await addStreamingMessage('Defendant', 'defendant', defendantRebuttal);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // ROUND 3: Final Arguments
    setRound(3);

    await addStreamingMessage(
      judgeName,
      'judge',
      `Plaintiff, your final argument on the strength of your case and why you deserve the damages requested?`
    );

    await new Promise(resolve => setTimeout(resolve, 1200));

    const plaintiffFinal = trialData.plaintiff_analysis?.legal_arguments?.[1] ||
      `Your Honor, we have presented clear evidence of breach, documented damages, and supporting precedents. The defendant's failure to perform was material and caused foreseeable harm. We respectfully request full compensation as outlined in our damages assessment.`;

    await addStreamingMessage('Plaintiff', 'plaintiff', plaintiffFinal);

    await new Promise(resolve => setTimeout(resolve, 1500));

    await addStreamingMessage(
      judgeName,
      'judge',
      `Defendant, your final statement?`
    );

    await new Promise(resolve => setTimeout(resolve, 1200));

    const defendantFinal = trialData.defendant_analysis?.legal_arguments?.[1] ||
      `Your Honor, we maintain that the plaintiff has failed to establish material breach. We fulfilled our obligations in good faith, and the plaintiff's damages claims are not supported by the evidence. We respectfully request dismissal of this case.`;

    await addStreamingMessage('Defendant', 'defendant', defendantFinal);

    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const runVerdictPhase = async () => {
    await addStreamingMessage(
      judgeName,
      'judge',
      `I will now deliberate on this case based on the evidence, arguments, and precedents presented. This is a complex matter that requires careful consideration of all factors.`
    );

    await new Promise(resolve => setTimeout(resolve, 1500));

    const verdictText = `After careful consideration of the evidence, legal arguments from both counsels, and the relevant precedents, I find that the plaintiff has presented a more compelling case. The evidence demonstrates a clear breach of the contractual obligations. The precedents cited support the plaintiff's position, and the damages claimed are reasonable and well-documented. Therefore, I rule in favor of the plaintiff and award damages of $125,000. This award reflects the documented losses and is consistent with similar cases in the precedent record.`;

    await addStreamingMessage(judgeName, 'verdict', verdictText);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const verdict = {
      judge: judgeName,
      verdict: 'Plaintiff Wins',
      damages: '$125,000',
      confidence: 0.78,
      reasoning: verdictText,
      citations: [
        { title: 'Smith v. Johnson Corp.', category: 'Contract Breach' },
        { title: 'Williams v. Tech Solutions Inc.', category: 'Damages Assessment' },
        { title: 'Anderson v. Business Partners LLC', category: 'Liability' }
      ],
      plaintiff_strength: 78,
      defendant_strength: 22,
      evidence_quality: 85
    };

    setVerdictData(verdict);
    setShowReport(true);
  };

  if (!trialData) {
    return null;
  }

  return (
    <div className="chat-trial-wrapper">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">⚖️</span>
            <div className="logo-text">
              <div className="logo-title">AI Courtroom</div>
              <div className="logo-subtitle">Simulator</div>
            </div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search cases..."
            className="search-input"
          />
        </div>

        <button className="new-simulation-btn">
          <span>+</span>
          New Simulation
        </button>

        <div className="sidebar-section">
        </div>

        <div className="sidebar-footer">
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-trial-container">
        <div className="chat-trial-header">
          <button onClick={onBack} className="chat-back-btn">
            <ArrowLeft size={20} />
          </button>
          <h1>{trialData.case_title}</h1>
          <div className="chat-round-indicator">
            {trialPhase === 'loading' && 'Starting...'}
            {trialPhase === 'preparation' && 'Preparation Phase'}
            {trialPhase === 'trial' && `Round ${round}/3`}
            {trialPhase === 'verdict' && 'Verdict'}
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={`msg-${msg.id}-${msg.role}`} className={`chat-message chat-${msg.role}`}>
              <div className="chat-bubble">
                <div className="chat-speaker">{msg.speaker}</div>
                {msg.analysis && (
                  <ThinkingProcess analysis={msg.analysis} speaker={msg.speaker} />
                )}
                {streamingMessageId === msg.id ? (
                  <StreamingText text={msg.text} isStreaming={true} />
                ) : (
                  <div className="chat-text">{msg.text}</div>
                )}
                <div className="chat-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showReport && verdictData && (
          <VerdictReport
            verdict={verdictData}
            caseTitle={trialData.case_title}
            onClose={() => setShowReport(false)}
          />
        )}
      </div>
    </div>
  );
}
