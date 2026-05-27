'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import SessionSidebar from './components/SessionSidebar';
import SetupForm from './components/SetupForm';
import ChatView from './components/ChatView';
import { useTrialSessions } from './hooks/useTrialSessions';
import { useTrialWebSocket } from './hooks/useTrialWebSocket';
import './courtroom.css';
import './components/chat-view.css';

export default function CourtroomPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  const { sessions, loading: sessionsLoading, fetchSessions, createSession, getSession, deleteSession, pauseSession } = useTrialSessions();
  const { messages, waitingForInput, trialComplete, error, connect, sendMessage, disconnect, stopSession } = useTrialWebSocket();

  const [view, setView] = useState('setup'); // 'setup' | 'trial'
  const [activeSession, setActiveSession] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const syncedCompletionRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  useEffect(() => {
    if (!trialComplete || !activeSession?.id || syncedCompletionRef.current === activeSession.id) return;

    syncedCompletionRef.current = activeSession.id;
    (async () => {
      const full = await getSession(activeSession.id).catch(() => null);
      if (full) setActiveSession(full);
      await fetchSessions();
    })();
  }, [trialComplete, activeSession?.id, getSession, fetchSessions]);

  async function handleSetupSubmit(formData) {
    setFormLoading(true);
    try {
      const session = await createSession(formData);
      setActiveSession(session);
      setView('trial');
      connect(session.id);
    } catch (e) {
      alert(e.message || 'Failed to start session');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSelectSession(s) {
    try {
      const full = await getSession(s.id);
      setActiveSession(full);
      setView('trial');
      // Only connect WebSocket for in-progress trials
      if (full.status === 'in_progress') {
        connect(full.id);
      } else {
        // Completed session — disconnect any active WS so hook messages stay empty
        disconnect();
      }
    } catch (e) {
      alert('Failed to load session');
    }
  }

  // Normalize stored TrialMessage objects to the shape ChatView expects
  function normalizeStoredMessages(rawMessages) {
    if (!rawMessages?.length) return [];
    return rawMessages.map((m) => {
      // Determine type from role + phase
      let type = 'argument';
      if (m.role === 'judge') {
        type = m.phase === 'verdict' ? 'verdict' : 'evaluation';
      }
      return {
        type,
        role: m.role,
        phase: m.phase,
        round: m.round_number,          // rename round_number → round
        content: m.content,
        thinking_steps: m.thinking_steps || [],
        // For verdict messages, pull winner from session-level field
        winner: m.phase === 'verdict' ? (activeSession?.winner || null) : null,
      };
    });
  }

  function handleNewTrial() {
    disconnect();
    setActiveSession(null);
    setView('setup');
  }

  async function handleStopTrial() {
    stopSession();
    if (activeSession) {
      setActiveSession(prev => prev ? { ...prev, status: 'paused' } : prev);
      await pauseSession(activeSession.id).catch(() => null);
    }
    // Refresh sessions so sidebar shows updated status
    await fetchSessions();
  }

  async function handleRetryTrial() {
    if (!activeSession) return;
    disconnect();
    // Small delay to let WS close cleanly
    await new Promise(r => setTimeout(r, 300));
    connect(activeSession.id);
  }

  async function handleDeleteSession(id) {
    if (!confirm('Delete this session?')) return;
    await deleteSession(id);
    if (activeSession?.id === id) handleNewTrial();
  }

  if (authLoading) return <div className="courtroom-loading">Loading...</div>;

  return (
    <div className={`courtroom-layout ${theme}`}>
      <SessionSidebar
        sessions={sessions}
        loading={sessionsLoading}
        onSelect={handleSelectSession}
        onNew={handleNewTrial}
        onDelete={handleDeleteSession}
        activeId={activeSession?.id}
        onLoad={fetchSessions}
      />

      <main className="courtroom-main">
        {view === 'setup' && (
          <div className="setup-container">
            <SetupForm onSubmit={handleSetupSubmit} loading={formLoading} />
          </div>
        )}

        {view === 'trial' && activeSession && (
          <ChatView
            session={activeSession}
            messages={messages.length > 0 ? messages : normalizeStoredMessages(activeSession.messages)}
            waitingForInput={waitingForInput}
            trialComplete={trialComplete || activeSession.status === 'completed'}
            error={error}
            onSendArgument={sendMessage}
            onStop={handleStopTrial}
            onRetry={error ? handleRetryTrial : undefined}
          />
        )}
      </main>
    </div>
  );
}
