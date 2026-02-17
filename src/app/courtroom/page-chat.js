'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Send, RotateCcw, Download, ArrowLeft } from 'lucide-react';
import './courtroom-chat.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CourtroomChat() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [caseType, setCaseType] = useState('Criminal');
  const [caseDescription, setCaseDescription] = useState('');
  const [plaintiffFile, setPlaintiffFile] = useState(null);
  const [defendantFile, setDefendantFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading courtroom...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleStartBattle = async () => {
    if (!caseDescription.trim()) {
      setError('Please enter a case description');
      return;
    }

    setIsSimulating(true);
    setError('');
    setMessages([]);

    const formData = new FormData();
    formData.append('case_type', caseType);
    formData.append('case_description', caseDescription);
    if (plaintiffFile) formData.append('plaintiff_file', plaintiffFile);
    if (defendantFile) formData.append('defendant_file', defendantFile);

    try {
      // Add case initiated message
      setMessages([
        {
          type: 'system',
          text: `Case initiated: ${caseDescription}. The courtroom simulation has begun.`,
          time: formatTime(),
        },
      ]);

      const response = await fetch(`${API_BASE_URL}/api/courtroom/simulate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Simulation failed');

      const data = await response.json();

      // Add judge opening
      setMessages((prev) => [
        ...prev,
        {
          type: 'judge',
          name: 'Judge Morrison',
          text: `Good morning. We are here today to address the matter of ${caseDescription}. Counsel for the plaintiff, you may begin.`,
          time: formatTime(),
        },
      ]);

      // Add plaintiff arguments
      if (data.plaintiff_arguments && data.plaintiff_arguments.length > 0) {
        data.plaintiff_arguments.forEach((arg, idx) => {
          setMessages((prev) => [
            ...prev,
            {
              type: 'plaintiff',
              name: 'Attorney Sarah Chen (Plaintiff)',
              text: arg,
              precedents: data.plaintiff_precedents?.[idx] || [],
              time: formatTime(),
            },
          ]);
        });
      }

      // Add defendant arguments
      if (data.defendant_arguments && data.defendant_arguments.length > 0) {
        data.defendant_arguments.forEach((arg, idx) => {
          setMessages((prev) => [
            ...prev,
            {
              type: 'defendant',
              name: 'Attorney Michael Roberts (Defendant)',
              text: arg,
              precedents: data.defendant_precedents?.[idx] || [],
              time: formatTime(),
            },
          ]);
        });
      }

      // Add verdict
      setMessages((prev) => [
        ...prev,
        {
          type: 'judge',
          name: 'Judge Morrison',
          text: `Based on the arguments presented and applicable law, I render the following verdict: ${data.verdict}`,
          time: formatTime(),
          isVerdict: true,
        },
      ]);

      // Store case data for download
      window.caseData = data;
    } catch (err) {
      setError(err.message || 'Error simulating courtroom');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCaseDescription('');
    setPlaintiffFile(null);
    setDefendantFile(null);
    setError('');
  };

  const handleDownloadReport = () => {
    if (!window.caseData) return;

    const data = window.caseData;
    const report = `
COURTROOM BATTLE TRANSCRIPT
===========================

Case Type: ${caseType}
Case Description: ${caseDescription}
Date: ${new Date().toLocaleString()}

MESSAGES:
${messages
        .map((msg) => {
          if (msg.type === 'system') return `[SYSTEM] ${msg.text}`;
          if (msg.type === 'judge') return `[JUDGE] ${msg.name}: ${msg.text}`;
          if (msg.type === 'plaintiff') return `[PLAINTIFF] ${msg.name}: ${msg.text}`;
          if (msg.type === 'defendant') return `[DEFENDANT] ${msg.name}: ${msg.text}`;
        })
        .join('\n\n')}

VERDICT:
${data.verdict}

CONFIDENCE: ${data.confidence}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courtroom-transcript-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="courtroom-chat">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="header-title">⚖️ Courtroom Battle Simulator</div>
          <div className="case-status">
            <div className="status-item">
              <span className="status-label">Case Type</span>
              <span className="status-value">{caseType}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Status</span>
              <span className="status-value">
                {isSimulating ? 'Simulating...' : messages.length > 0 ? 'Complete' : 'Ready'}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-secondary"
            style={{ marginLeft: 'auto' }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-container">
        {messages.length === 0 ? (
          // Input Form
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
                Start a New Courtroom Battle
              </h2>

              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    color: '#fca5a5',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="input-form">
                <div className="form-group">
                  <label className="form-label">Case Type</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="form-select"
                  >
                    <option value="Criminal">Criminal</option>
                    <option value="Civil">Civil</option>
                    <option value="Family">Family</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Plaintiff File (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setPlaintiffFile(e.target.files?.[0])}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Case Description</label>
                  <textarea
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                    placeholder="Describe the case details, facts, and legal issues..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Defendant File (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setDefendantFile(e.target.files?.[0])}
                    className="form-input"
                  />
                </div>

                <div className="button-group">
                  <button
                    onClick={handleStartBattle}
                    disabled={isSimulating}
                    className="btn btn-primary"
                  >
                    <Send size={18} />
                    {isSimulating ? 'Starting Battle...' : 'Start Battle'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className="message-group">
                <div className={`message-avatar ${msg.type}`}>
                  {msg.type === 'judge' && 'J'}
                  {msg.type === 'plaintiff' && 'P'}
                  {msg.type === 'defendant' && 'D'}
                  {msg.type === 'system' && 'ℹ'}
                </div>
                <div className="message-content">
                  {msg.type !== 'system' && (
                    <div className="message-header">
                      <span className={`message-name ${msg.type}`}>{msg.name}</span>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  )}
                  <div className={`message-bubble ${msg.type}`}>
                    {msg.text}
                    {msg.precedents && msg.precedents.length > 0 && (
                      <div className="message-precedents">
                        {msg.precedents.map((prec, pidx) => (
                          <div key={pidx} className="precedent-item">
                            <span className="precedent-score">
                              {(prec.relevance * 100).toFixed(0)}%
                            </span>
                            <span className="precedent-name">{prec.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Controls */}
      {messages.length > 0 && (
        <div className="input-section">
          <div className="input-wrapper">
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleReset} className="btn btn-secondary" style={{ flex: 1 }}>
                <RotateCcw size={18} />
                New Battle
              </button>
              <button onClick={handleDownloadReport} className="btn btn-primary" style={{ flex: 1 }}>
                <Download size={18} />
                Download Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
