'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Send, Menu, X, Plus, Trash2, Clock, MessageSquare, Home,
  User, FileText, Scale, Sparkles, BookOpen, ArrowDown,
  Zap, Search, Shield, ChevronDown
} from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
import ReactMarkdown from 'react-markdown';
import './assistant.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

export default function Assistant() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [abortController, setAbortController] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Nepal');
  const [responseMode, setResponseMode] = useState('fast');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [currentModel, setCurrentModel] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
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

  // Load conversation list from server
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE_URL}/api/conversations`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChatHistory(data.map(c => ({ id: c.id, title: c.title, date: c.updated_at })));
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

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
  }, []);

  // Load messages when switching conversations
  useEffect(() => {
    if (!currentChatId) return;
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

  // Health check — once on mount only
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`).then(r => setIsConnected(r.ok)).catch(() => setIsConnected(false));
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Show/hide scroll button
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  if (loading) {
    return (
      <div className="ka-loading">
        <div className="ka-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }
  if (!isAuthenticated) return null;

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
    setChatMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setIsTyping(true);

    // Create conversation on server if new chat
    let activeChatId = currentChatId;
    if (!currentChatId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/conversations`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ title: userMsg.substring(0, 50) + (userMsg.length > 50 ? '...' : ''), country: selectedCountry, model_id: currentModel?.id || null }),
        });
        const data = await res.json();
        activeChatId = data.id;
        setCurrentChatId(data.id);
        setChatHistory(prev => [{ id: data.id, title: data.title, date: 'Now' }, ...prev]);
      } catch {
        setIsTyping(false);
        return;
      }
    }

    // Save user message to server
    await saveMessage(activeChatId, 'user', userMsg);

    const ctrl = new AbortController();
    setAbortController(ctrl);
    const botId = Date.now();

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
              setChatMessages(prev => {
                const exists = prev.find(m => m.id === botId);
                if (!exists) return [...prev, { id: botId, type: 'bot', text: '', isStreaming: true, status: data.message }];
                return prev.map(m => m.id === botId ? { ...m, status: data.message } : m);
              });
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
              // Save assistant response to server
              await saveMessage(activeChatId, 'assistant', fullText, botSources);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) { if (e.message?.includes('Stream failed')) throw e; }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setIsTyping(false);
        setChatMessages(prev => {
          const exists = prev.find(m => m.id === botId);
          const errMsg = { id: botId, type: 'bot', text: `Something went wrong: ${error.message}`, isStreaming: false, isError: true };
          return exists ? prev.map(m => m.id === botId ? errMsg : m) : [...prev, errMsg];
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleInputChange = (e) => {
    setChatMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const handleNewChat = () => {
    setChatMessages([]);
    setCurrentChatId(null);
    setChatMessage('');
  };

  const handleDeleteChat = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/conversations/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) handleNewChat();
  };

  const handleSelectChat = (id) => {
    setCurrentChatId(id);
    setSidebarOpen(false);
  };

  const suggestions = [
    { icon: <Scale size={18} />, text: 'What are the penalties for theft in Nepal?', label: 'Criminal Law' },
    { icon: <Shield size={18} />, text: 'What are my fundamental rights under Nepal Constitution?', label: 'Constitutional' },
    { icon: <BookOpen size={18} />, text: 'How to register a business in Nepal?', label: 'Business Law' },
    { icon: <User size={18} />, text: 'What are employee rights under Nepal Labour Act?', label: 'Labour Law' },
  ];

  // --- Render helpers ---
  const renderMessage = (msg, idx) => {
    const isUser = msg.type === 'user';
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
    <div className="ka-page">
      {/* Sidebar */}
      <aside className={`ka-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="ka-sidebar-top">
          <div className="ka-sidebar-brand">
            <Scale size={20} />
            <span>KaanoonGPT</span>
          </div>
          <button className="ka-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>
        <button className="ka-new-chat" onClick={handleNewChat}>
          <Plus size={16} />
          <span>New Chat</span>
        </button>
        <div className="ka-history">
          {chatHistory.length > 0 ? chatHistory.map(chat => (
            <div key={chat.id} className={`ka-history-item ${currentChatId === chat.id ? 'active' : ''}`}>
              <button className="ka-history-link" onClick={() => handleSelectChat(chat.id)} title={chat.title}>
                <MessageSquare size={14} />
                <span>{chat.title}</span>
              </button>
              <button className="ka-history-del" onClick={() => handleDeleteChat(chat.id)} aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          )) : (
            <div className="ka-history-empty">
              <Clock size={20} />
              <p>No conversations yet</p>
            </div>
          )}
        </div>
        <div className="ka-sidebar-footer">
          <button className="ka-sidebar-nav" onClick={() => router.push('/dashboard')}>
            <Home size={16} /><span>Home</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="ka-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="ka-main">
        {/* Top bar */}
        <header className="ka-topbar">
          <div className="ka-topbar-left">
            <button className="ka-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              <Menu size={20} />
            </button>
            <span className="ka-topbar-title">KaanoonGPT</span>
          </div>
          <div className="ka-topbar-right">
            <div className="ka-chip">{selectedCountry === 'Nepal' ? '🇳🇵' : '🇺🇸'} {selectedCountry}</div>
            <div className="ka-model-picker" ref={modelMenuRef}>
              <button className="ka-chip ka-chip-model" onClick={() => setShowModelMenu(!showModelMenu)}>
                {currentModel ? currentModel.name : 'No model'}
                <ChevronDown size={12} />
              </button>
              {showModelMenu && availableModels.length > 0 && (
                <div className="ka-model-menu">
                  {availableModels.map(m => (
                    <button
                      key={m.id}
                      className={`ka-model-opt ${currentModel?.id === m.id ? 'active' : ''}`}
                      onClick={() => { setCurrentModel(m); setShowModelMenu(false); }}
                    >
                      <span className="ka-model-provider">{m.provider}</span>
                      <span>{m.name}</span>
                      {currentModel?.id === m.id && <span className="ka-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={`ka-status-dot ${isConnected ? 'online' : 'offline'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
          </div>
        </header>

        {/* Chat area */}
        <div className="ka-chat" ref={chatContainerRef} onScroll={handleScroll}>
          {isEmptyChat ? (
            <div className="ka-welcome">
              <div className="ka-welcome-icon">
                <img src="/logo.png" alt="KaanoonGPT" className="ka-welcome-logo" />
              </div>
              <h1 className="ka-welcome-title">Ask about Nepal Law</h1>
              <p className="ka-welcome-sub">
                Your AI legal assistant powered by Nepal's Constitution, Civil Code, Criminal Code, and Labour Act.
              </p>
              <div className="ka-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="ka-suggestion"
                    onClick={() => handleSendMessage(s.text)}
                    disabled={isTyping || !isConnected}
                  >
                    <div className="ka-suggestion-icon">{s.icon}</div>
                    <div className="ka-suggestion-content">
                      <span className="ka-suggestion-label">{s.label}</span>
                      <span className="ka-suggestion-text">{s.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ka-messages">
              {chatMessages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <button className="ka-scroll-btn" onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            <ArrowDown size={18} />
          </button>
        )}

        {/* Input */}
        <div className="ka-input-area">
          <div className="ka-input-box">
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
          </div>
          <p className="ka-disclaimer">KaanoonGPT can make mistakes. Verify important legal information with a qualified lawyer.</p>
        </div>
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
