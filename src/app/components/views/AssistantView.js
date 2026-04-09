'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Plus, FileText, Sparkles, Copy, Check, RotateCcw, ChevronDown
} from 'lucide-react';
import PDFViewer from '../PDFViewer';
import ReactMarkdown from 'react-markdown';
import './AssistantView.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

export default function AssistantView({ user, theme, currentChatId, onChatIdChange }) {
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [abortController, setAbortController] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCountry] = useState('Nepal');
  const [responseMode] = useState('fast');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [currentModel, setCurrentModel] = useState(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const modelMenuRef = useRef(null);

  const isEmptyChat = chatMessages.length === 0;

  // Close model menu on outside click
  useEffect(() => {
    if (!showModelMenu) return;
    const handler = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) setShowModelMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelMenu]);

  // Fetch admin-configured chat models
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/courtroom/setup/chat-models`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const models = d.models || [];
        setAvailableModels(models);
        if (models.length > 0 && !currentModel) setCurrentModel(models[0]);
      })
      .catch(() => {});
  }, [currentModel]);

  // Load messages when switching conversations
  useEffect(() => {
    if (!currentChatId) {
      setChatMessages([]);
      return;
    }
    fetch(`${API_BASE_URL}/api/conversations/${currentChatId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.messages) {
          setChatMessages(data.messages.map((m, i) => ({
            id: `${currentChatId}_${i}`,
            type: m.role === 'user' ? 'user' : 'bot',
            text: m.content,
            sources: m.sources || null,
          })));
        }
      })
      .catch(() => {});
  }, [currentChatId]);

  // Health check
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`).then(r => setIsConnected(r.ok)).catch(() => setIsConnected(false));
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Save a message to the server
  const saveMessage = async (convId, role, content, sources = null) => {
    try {
      const body = { role, content };
      if (sources) body.sources = sources;
      await fetch(`${API_BASE_URL}/api/conversations/${convId}/messages`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
    } catch {}
  };

  const handleSendMessage = async (overrideMsg) => {
    const userMsg = (overrideMsg || chatMessage).trim();
    if (!userMsg || isTyping) return;
    if (abortController) { abortController.abort(); setAbortController(null); }

    setChatMessage('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    const userMsgId = Date.now() - 1;
    const timestamp = new Date().toISOString();
    setChatMessages(prev => [...prev, { id: userMsgId, type: 'user', text: userMsg, timestamp }]);
    setIsTyping(true);

    const botId = Date.now();
    setChatMessages(prev => [...prev, { id: botId, type: 'bot', text: '', isStreaming: true, status: 'Thinking...', timestamp: new Date().toISOString() }]);

    let activeChatId = currentChatId;
    if (!currentChatId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/conversations`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ title: userMsg.substring(0, 50) + (userMsg.length > 50 ? '...' : ''), country: selectedCountry, model_id: currentModel?.id || null }),
        });
        if (!res.ok) throw new Error('Failed to create conversation');
        const data = await res.json();
        activeChatId = data.id;
        onChatIdChange(data.id);
      } catch (err) {
        setIsTyping(false);
        setChatMessages(prev => prev.map(m =>
          m.id === botId ? { ...m, text: 'Failed to create conversation. Please try again.', isStreaming: false, isError: true } : m
        ));
        return;
      }
    }

    if (activeChatId) {
      await saveMessage(activeChatId, 'user', userMsg);
    }

    const ctrl = new AbortController();
    setAbortController(ctrl);

    try {
      const history = chatMessages.slice(-10).map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant', content: m.text
      }));

      const response = await fetch(`${API_BASE_URL}/api/rag/ultra-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg, country: selectedCountry,
          mode: responseMode, conversation_history: history,
          model_id: currentModel?.id || null
        }),
        signal: ctrl.signal,
      });

      if (!response.ok) throw new Error(`Stream failed: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let botSources = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'status') {
              setChatMessages(prev => prev.map(m =>
                m.id === botId ? { ...m, status: data.message } : m
              ));
            } else if (data.type === 'token') {
              fullText += data.text;
              setChatMessages(prev => prev.map(m =>
                m.id === botId ? { ...m, text: fullText, status: null, isStreaming: true } : m
              ));
            } else if (data.type === 'sources') {
              botSources = data.sources;
              setChatMessages(prev => prev.map(m =>
                m.id === botId ? { ...m, sources: data.sources } : m
              ));
            } else if (data.type === 'complete') {
              setIsTyping(false);
              setChatMessages(prev => prev.map(m =>
                m.id === botId ? { ...m, text: fullText || data.text, isStreaming: false, status: null, responseTime: data.response_time } : m
              ));
              setAbortController(null);
              if (activeChatId && fullText) {
                await saveMessage(activeChatId, 'assistant', fullText, botSources);
              }
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) { if (e.message?.includes('Stream failed')) throw e; }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setIsTyping(false);
        const errorMessage = `Error: ${error.message}. Please check if the backend is running on port 8000.`;
        setChatMessages(prev => {
          const exists = prev.find(m => m.id === botId);
          const errMsg = { id: botId, type: 'bot', text: errorMessage, isStreaming: false, isError: true };
          return exists ? prev.map(m => m.id === botId ? errMsg : m) : [...prev, errMsg];
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    if (e.key === 'Enter' && e.shiftKey) {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
      }
    }
  };

  const handleInputChange = (e) => {
    setChatMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const handleCopyMessage = async (text, msgId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerateResponse = () => {
    const lastUserMsg = [...chatMessages].reverse().find(m => m.type === 'user');
    if (lastUserMsg) {
      setChatMessages(prev => {
        const lastBotIndex = [...prev].reverse().findIndex(m => m.type === 'bot');
        if (lastBotIndex === -1) return prev;
        const actualIndex = prev.length - 1 - lastBotIndex;
        return prev.slice(0, actualIndex);
      });
      handleSendMessage(lastUserMsg.text);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderMessage = (msg, idx) => {
    const isUser = msg.type === 'user';
    const isCopied = copiedMessageId === msg.id;
    const isLastBotMessage = !isUser && idx === chatMessages.length - 1;
    
    return (
      <div key={msg.id || idx} className={`ka-msg ${isUser ? 'ka-msg-user' : 'ka-msg-bot'} ${msg.isError ? 'ka-msg-error' : ''}`}>
        <div className="ka-msg-row">
          {!isUser && (
            <div className="ka-avatar">
              <img src="/logo.png" alt="AI" />
            </div>
          )}
          <div className={`ka-bubble ${isUser ? 'ka-bubble-user' : 'ka-bubble-bot'}`}>
            {msg.isStreaming && msg.status && (
              <div className="ka-status">
                <div className="ka-dots"><span /><span /><span /></div>
                <span>{msg.status}</span>
              </div>
            )}
            {msg.text && (
              <div className="ka-text">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                {msg.isStreaming && <span className="ka-cursor">▊</span>}
              </div>
            )}
            {msg.text && !msg.isStreaming && (
              <div className="ka-msg-footer">
                {msg.timestamp && (
                  <span className="ka-timestamp">{formatTime(msg.timestamp)}</span>
                )}
                {!isUser && (
                  <div className="ka-msg-actions">
                    <button
                      className="ka-action-btn"
                      onClick={() => handleCopyMessage(msg.text, msg.id)}
                      title="Copy message"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    {isLastBotMessage && !isTyping && (
                      <button
                        className="ka-action-btn"
                        onClick={handleRegenerateResponse}
                        title="Regenerate response"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {msg.responseTime && (
              <div className="ka-meta">⏱ {msg.responseTime}s</div>
            )}
            {msg.sources && msg.sources.length > 0 && (
              <div className="ka-sources">
                <div className="ka-sources-row">
                  <button
                    className="ka-source-chip"
                    onClick={() => {
                      setSelectedCitation({ ...msg.sources[0], url: msg.sources[0].file_url || msg.sources[0].url });
                      setPdfViewerOpen(true);
                    }}
                    title={`${msg.sources[0].source} — Page ${msg.sources[0].page}`}
                  >
                    <FileText size={12} />
                    <span>{msg.sources[0].article || msg.sources[0].source}</span>
                    {msg.sources[0].page && <span className="ka-chip-page">p.{msg.sources[0].page}</span>}
                  </button>
                  {msg.sources.length > 1 && (
                    <button
                      className="ka-source-more"
                      onClick={() => {
                        setChatMessages(prev => prev.map(m =>
                          m.id === msg.id ? { ...m, showAllSources: !m.showAllSources } : m
                        ));
                      }}
                    >
                      {msg.showAllSources ? 'Hide' : `+${msg.sources.length - 1} more`}
                    </button>
                  )}
                </div>
                {msg.showAllSources && (
                  <div className="ka-sources-expanded">
                    {msg.sources.slice(1).map((src, i) => (
                      <button
                        key={i}
                        className="ka-source-chip"
                        onClick={() => {
                          setSelectedCitation({ ...src, url: src.file_url || src.url });
                          setPdfViewerOpen(true);
                        }}
                        title={`${src.source} — Page ${src.page}`}
                      >
                        <FileText size={12} />
                        <span>{src.article || src.source}</span>
                        {src.page && <span className="ka-chip-page">p.{src.page}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="assistant-view">
      {/* Chat area */}
      <div className="ka-chat" ref={chatContainerRef}>
        {isEmptyChat ? (
          <div className="ka-welcome">
            <h1 className="ka-welcome-title">Ask about Nepal Law</h1>
            <p className="ka-welcome-sub">
              Your AI legal assistant powered by Nepal's Constitution, Civil Code, Criminal Code, and Labour Act.
            </p>
          </div>
        ) : (
          <div className="ka-messages">
            {chatMessages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`ka-input-area ${isEmptyChat ? 'centered' : ''}`}>
        <div className="ka-input-box">
          <div className="ka-input-wrapper">
            <button className="ka-plus-btn" title="Attach file">
              <Plus size={20} />
            </button>
            <textarea
              ref={inputRef}
              value={chatMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Nepal law..."
              className="ka-input"
              disabled={!isConnected || isTyping}
              rows={1}
            />
            {isTyping ? (
              <button className="ka-send-btn ka-stop-btn" onClick={() => { abortController?.abort(); setAbortController(null); setIsTyping(false); }} title="Stop">
                <div className="ka-stop-icon" />
              </button>
            ) : (
              <button className="ka-send-btn" onClick={() => handleSendMessage()} disabled={!isConnected || !chatMessage.trim()} title="Send">
                <Send size={18} />
              </button>
            )}
            <div className="ka-model-inline" ref={modelMenuRef}>
              <button className="ka-model-trigger" onClick={() => setShowModelMenu(!showModelMenu)}>
                <Sparkles size={14} />
                <span className="ka-model-name">{currentModel ? currentModel.name : 'Select model'}</span>
                <ChevronDown size={12} />
              </button>
              {showModelMenu && availableModels.length > 0 && (
                <div className="ka-model-dropdown">
                  <div className="ka-model-dropdown-header">Model</div>
                  {availableModels.map(m => (
                    <button
                      key={m.id}
                      className={`ka-model-opt ${currentModel?.id === m.id ? 'active' : ''}`}
                      onClick={() => { setCurrentModel(m); setShowModelMenu(false); }}
                    >
                      <div className="ka-model-opt-info">
                        <span className="ka-model-opt-name">{m.name}</span>
                        <span className="ka-model-opt-provider">{m.provider}</span>
                      </div>
                      {currentModel?.id === m.id && <span className="ka-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="ka-disclaimer">KaanoonGPT can make mistakes. Verify important legal information with a qualified lawyer.</p>
      </div>

      {/* PDF Viewer */}
      <PDFViewer
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrl={selectedCitation?.file_url || selectedCitation?.url}
        citation={selectedCitation?.article ? `${selectedCitation.article}, ${selectedCitation.source}` : selectedCitation?.source}
        highlightText={selectedCitation?.snippet || selectedCitation?.searchText}
        pageNumber={selectedCitation?.page}
      />
    </div>
  );
}
