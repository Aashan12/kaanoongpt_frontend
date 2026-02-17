'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Send, Menu, X, Plus, Trash2, Clock, MessageSquare, Home, User, FileText } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
import './assistant.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Assistant() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: '👋 Namaste! I\'m your AI Legal Assistant. Ask me anything about Nepali law!' }
  ]);
  const [abortController, setAbortController] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Nepal');
  const [responseMode, setResponseMode] = useState('fast');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Criminal Penalties in Nepal', date: 'Today' }
  ]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const settingsDropdownRef = useRef(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [currentModel, setCurrentModel] = useState('llama'); // Track current AI model

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chatHistory');
    if (savedChats) {
      try {
        setChatHistory(JSON.parse(savedChats));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Load current AI model on mount
  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/model/current`);
        if (response.ok) {
          const data = await response.json();
          setCurrentModel(data.provider);
          console.log('Current model:', data.provider);
        }
      } catch (error) {
        console.error('Failed to fetch current model:', error);
      }
    };
    fetchCurrentModel();
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Load current chat messages from localStorage
  useEffect(() => {
    if (currentChatId) {
      const savedMessages = localStorage.getItem(`chat_${currentChatId}`);
      if (savedMessages) {
        try {
          setChatMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Failed to load chat messages:', e);
        }
      }
    }
  }, [currentChatId]);

  // Save current chat messages to localStorage
  useEffect(() => {
    if (currentChatId && chatMessages.length > 1) {
      localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, currentChatId]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setSettingsMenuOpen(false);
      }
    };

    if (settingsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [settingsMenuOpen]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your legal companion...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isTyping) return;
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    const userMsg = chatMessage.trim();
    console.log('=== SENDING MESSAGE ===');
    console.log('Message:', userMsg);
    console.log('Country:', selectedCountry);
    console.log('Mode:', responseMode);
    console.log('API URL:', `${API_BASE_URL}/api/rag/ultra-stream`);

    setChatMessage('');
    setChatMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setIsTyping(true);
    setShowSuggestions(false); // Hide suggestions when sending message

    // Auto-generate title on first message
    let activeChatId = currentChatId;
    if (!currentChatId) {
      const newChatId = Date.now();
      const generatedTitle = generateChatTitle(userMsg);
      const newChat = {
        id: newChatId,
        title: generatedTitle,
        date: 'Today'
      };
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      activeChatId = newChatId;
    } else if (currentChatId && chatMessages.length === 1) {
      const generatedTitle = generateChatTitle(userMsg);
      setChatHistory(prev => prev.map(chat =>
        chat.id === currentChatId && chat.title === 'New Chat'
          ? { ...chat, title: generatedTitle }
          : chat
      ));
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    const botMessageId = Date.now();

    try {
      const conversationHistory = chatMessages
        .slice(-10)
        .map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.text }));

      const response = await fetch(`${API_BASE_URL}/api/rag/ultra-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          country: selectedCountry,
          mode: responseMode,
          conversation_history: conversationHistory
        }),
        signal: newAbortController.signal,
      });

      if (!response.ok) throw new Error(`Stream failed: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let ttftReceived = false;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                // Show status message
                setChatMessages(prev => {
                  const exists = prev.find(m => m.id === botMessageId);
                  if (!exists) {
                    return [...prev, {
                      id: botMessageId,
                      type: 'bot',
                      text: '',
                      isStreaming: true,
                      status: data.message,
                      startTime: Date.now()
                    }];
                  }
                  return prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, status: data.message }
                      : msg
                  );
                });
              } else if (data.type === 'ttft') {
                // Time To First Token - show just the time value
                setChatMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? {
                      ...msg,
                      ttft: data.time,
                      ttftMessage: `⏱️ ${data.time}s`,
                      status: null
                    }
                    : msg
                ));
              } else if (data.type === 'token') {
                // Stream individual token - accumulate text
                fullText += data.text;
                setChatMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? {
                      ...msg,
                      text: fullText,
                      status: null,
                      isStreaming: true
                    }
                    : msg
                ));
              } else if (data.type === 'sources') {
                // Store sources
                setChatMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, sources: data.sources }
                    : msg
                ));
              } else if (data.type === 'complete') {
                // Stream complete - finalize message
                setIsTyping(false);
                setChatMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? {
                      ...msg,
                      text: fullText || data.text,
                      isStreaming: false,
                      status: null,
                      responseTime: data.response_time
                    }
                    : msg
                ));
                setAbortController(null);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.type === 'complete') {
            setIsTyping(false);
            setChatMessages(prev => prev.map(msg =>
              msg.id === botMessageId
                ? {
                  ...msg,
                  text: fullText || data.text,
                  isStreaming: false,
                  status: null,
                  responseTime: data.response_time
                }
                : msg
            ));
            setAbortController(null);
          }
        } catch (e) {
          console.warn('Final buffer parse error:', e);
        }
      }
    } catch (error) {
      console.error('=== STREAMING ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error.stack);

      if (error.name !== 'AbortError') {
        setIsTyping(false);
        setChatMessages(prev => prev.map(msg =>
          msg.id === botMessageId
            ? {
              ...msg,
              text: `❌ Error: ${error.message}. Please check the console for details and try again.`,
              isStreaming: false,
              status: null
            }
            : msg
        ));
      }
    }
  };

  const handleInputChange = (e) => {
    setChatMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

    // Hide suggestions when user starts typing
    if (e.target.value.trim() && showSuggestions) {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    const newChatId = Date.now();
    const initialMessages = [{ type: 'bot', text: '👋 Namaste! I\'m your AI Legal Assistant. Ask me anything about Nepali law!' }];

    // Create new chat session
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      date: 'Today',
      messages: initialMessages
    };

    setChatHistory(prev => [newChat, ...prev]);
    setChatMessages(initialMessages);
    setCurrentChatId(newChatId);
    setChatMessage('');
  };

  const generateChatTitle = (message) => {
    // Generate title from first user message (first 50 chars)
    return message.substring(0, 50) + (message.length > 50 ? '...' : '');
  };

  const handleDeleteChat = (id) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
    localStorage.removeItem(`chat_${id}`);
    if (currentChatId === id) handleNewChat();
  };

  const handleSelectChat = (id) => {
    setCurrentChatId(id);
    setSidebarOpen(false);
  };

  const legalSystems = [
    { code: 'Nepal', name: 'Nepal Law', flag: '🇳🇵' },
    { code: 'USA', name: 'US Federal Law', flag: '🇺🇸', disabled: true }
  ];

  const responseModes = [
    { id: 'lightning', name: 'Lightning', icon: '⚡', description: 'Quick' },
    { id: 'fast', name: 'Fast', icon: '🚀', description: 'Balanced' },
    { id: 'complete', name: 'Complete', icon: '🔍', description: 'Detailed' }
  ];

  return (
    <div className="assistant-page">
      <div className="bg-decoration">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* Sidebar */}
      <aside className={`assistant-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">KAANOONGPT</h2>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>
        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>
        <div className="chat-history">
          {chatHistory.length > 0 ? (
            chatHistory.map((chat) => (
              <div key={chat.id} className={`chat-history-item ${currentChatId === chat.id ? 'active' : ''}`}>
                <button className="chat-history-link" onClick={() => handleSelectChat(chat.id)} title={chat.title}>
                  <MessageSquare size={16} />
                  <span className="chat-title">{chat.title}</span>
                </button>
                <button className="chat-delete-btn" onClick={() => handleDeleteChat(chat.id)} title="Delete chat" aria-label="Delete chat">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-history">
              <Clock size={24} />
              <p>No conversations yet</p>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Header */}
      <header className="assistant-header">
        <div className="header-content">
          <div className="header-left">
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar" aria-label="Toggle sidebar">
              <Menu size={20} />
            </button>
            <span className="header-logo-text">KaanoonGPT</span>
          </div>

          <div className="header-actions">
            <button className="header-action-btn desktop-only" onClick={() => router.push('/dashboard')} title="Home">
              <Home size={18} />
              <span>Home</span>
            </button>
            <button className="header-action-btn desktop-only" title="Profile">
              <User size={18} />
              <span>Profile</span>
            </button>
            <div className="settings-dropdown-container" ref={settingsDropdownRef}>
              <button
                className="header-action-btn settings-btn"
                onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                title="Settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Settings</span>
              </button>
              {settingsMenuOpen && (
                <div className="settings-dropdown-menu">
                  <button className="dropdown-item" onClick={() => { router.push('/dashboard'); setSettingsMenuOpen(false); }}>
                    <Home size={18} />
                    <span className="desktop-text">Home</span>
                  </button>
                  <button className="dropdown-item">
                    <User size={18} />
                    <span className="desktop-text">Profile</span>
                  </button>
                  <div className="dropdown-divider"></div>

                  <div className="dropdown-section">
                    <div className="dropdown-section-title">
                      <span className="section-icon">🤖</span>
                      <span className="desktop-text">AI Model</span>
                    </div>
                    <button
                      className={`dropdown-item dropdown-option ${currentModel === 'llama' ? 'active' : ''}`}
                      onClick={async () => {
                        try {
                          const response = await fetch(`${API_BASE_URL}/api/model/switch`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ provider: 'llama' })
                          });
                          if (response.ok) {
                            setCurrentModel('llama');
                            console.log('✅ Switched to Llama');
                          }
                        } catch (error) {
                          console.error('Failed to switch model:', error);
                        }
                        setSettingsMenuOpen(false);
                      }}
                    >
                      <span className="mode-icon">🦙</span>
                      <span className="desktop-text option-name">Llama (Local)</span>
                      {currentModel === 'llama' && <span className="checkmark">✓</span>}
                    </button>
                    <button
                      className={`dropdown-item dropdown-option ${currentModel === 'openai' ? 'active' : ''}`}
                      onClick={async () => {
                        try {
                          const response = await fetch(`${API_BASE_URL}/api/model/switch`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ provider: 'openai' })
                          });
                          if (response.ok) {
                            setCurrentModel('openai');
                            console.log('✅ Switched to OpenAI');
                          } else {
                            const error = await response.json();
                            alert(`Failed: ${error.detail}`);
                          }
                        } catch (error) {
                          console.error('Failed to switch model:', error);
                          alert('Failed to switch model. Make sure backend is running.');
                        }
                        setSettingsMenuOpen(false);
                      }}
                    >
                      <span className="mode-icon">☁️</span>
                      <span className="desktop-text option-name">OpenAI GPT-4</span>
                      {currentModel === 'openai' && <span className="checkmark">✓</span>}
                    </button>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-section">
                    <div className="dropdown-section-title">
                      <span className="section-icon">⚡</span>
                      <span className="desktop-text">Response Time</span>
                    </div>
                    {responseModes.map((mode) => (
                      <button
                        key={mode.id}
                        className={`dropdown-item dropdown-option ${responseMode === mode.id ? 'active' : ''}`}
                        onClick={() => { setResponseMode(mode.id); setSettingsMenuOpen(false); }}
                      >
                        <span className="mode-icon">{mode.icon}</span>
                        <span className="desktop-text option-name">{mode.name}</span>
                        {responseMode === mode.id && <span className="checkmark">✓</span>}
                      </button>
                    ))}
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-section">
                    <div className="dropdown-section-title">
                      <span className="section-icon">🏛️</span>
                      <span className="desktop-text">Legal System</span>
                    </div>
                    {legalSystems.map((system) => (
                      <button
                        key={system.code}
                        className={`dropdown-item dropdown-option ${selectedCountry === system.code ? 'active' : ''} ${system.disabled ? 'disabled' : ''}`}
                        onClick={() => { if (!system.disabled) { setSelectedCountry(system.code); setSettingsMenuOpen(false); } }}
                        disabled={system.disabled}
                      >
                        <span className="country-flag">{system.flag}</span>
                        <span className="desktop-text option-name">{system.name}</span>
                        {selectedCountry === system.code && <span className="checkmark">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="assistant-main">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-content">
            <div className="chat-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span className="chat-header-text">Chat with Kanoon AI...</span>
          </div>
          <button className="chat-header-scroll-btn" onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} title="Scroll to bottom">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 21 6 15"></polyline>
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={msg.id || idx} className={`message-wrapper ${msg.type === 'user' ? 'message-user' : 'message-bot'} ${msg.isError ? 'message-error' : ''} message-appear`}>
              {msg.type === 'bot' && (
                <div className="message-avatar avatar-bot">
                  <img src="/logo.png" alt="AI" className="avatar-logo" />
                </div>
              )}
              <div className={`message-bubble ${msg.type === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                {msg.isStreaming && msg.status && (
                  <div className="streaming-status">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>{msg.status}</span>
                  </div>
                )}
                <div className="message-text">
                  {msg.text}
                  {msg.isStreaming && msg.text && <span className="streaming-cursor">|</span>}
                </div>
                {msg.responseTime && (
                  <div className="response-time-indicator">
                    <span>⏱️ {msg.responseTime}s</span>
                  </div>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="citations-section">
                    <div className="citations-header">📚 Sources</div>
                    <div className="citations-list">
                      {msg.sources.map((citation, idx) => (
                        <button
                          key={idx}
                          className="citation-item"
                          onClick={() => {
                            setSelectedCitation(citation);
                            setPdfViewerOpen(true);
                          }}
                          title="Click to view PDF"
                        >
                          <FileText size={16} />
                          <span className="citation-name">{citation.source}</span>
                          <span className="citation-page">p. {citation.page}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="chat-input-section">
          <div className="input-wrapper">
            <div className="textarea-container">
              <button className="attach-btn" title="Attach file">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <textarea
                value={chatMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about ${selectedCountry} law...`}
                className="chat-input"
                disabled={!isConnected || isTyping}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
              />
              {isTyping ? (
                <button onClick={() => { if (abortController) { abortController.abort(); setAbortController(null); setIsTyping(false); } }} className="chat-stop-btn" title="Stop generating">
                  ⏹
                </button>
              ) : (
                <button onClick={handleSendMessage} className="chat-send-btn" disabled={!isConnected || !chatMessage.trim()} title="Send message">
                  <Send size={20} />
                </button>
              )}
            </div>
          </div>
          {/* Suggestions */}
          {showSuggestions && (
            <div className="chat-suggestions">
              <button className="suggestion-chip" onClick={() => { setChatMessage('What are the penalties for theft in Nepal?'); }} disabled={isTyping || !isConnected}>
                ⚖️ Criminal penalties
              </button>
              <button className="suggestion-chip" onClick={() => { setChatMessage('How to register a business in Nepal?'); }} disabled={isTyping || !isConnected}>
                💼 Business registration
              </button>
              <button className="suggestion-chip" onClick={() => { setChatMessage('What are employee rights in Nepal?'); }} disabled={isTyping || !isConnected}>
                👤 Employee rights
              </button>
            </div>
          )}
        </div>
      </main>

      {/* PDF Viewer Modal */}
      <PDFViewer
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrl={selectedCitation?.url}
        citation={selectedCitation?.source}
        highlightText={selectedCitation?.snippet}
        pageNumber={selectedCitation?.page}
      />
    </div>
  );
}
