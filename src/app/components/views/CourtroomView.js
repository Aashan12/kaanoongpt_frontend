'use client';

import { useState, useEffect } from 'react';
import SessionSidebar from '../../courtroom/components/SessionSidebar';
import SetupForm from '../../courtroom/components/SetupForm';
import ChatView from '../../courtroom/components/ChatView';
import { useTrialSessions } from '../../courtroom/hooks/useTrialSessions';
import { useTrialWebSocket } from '../../courtroom/hooks/useTrialWebSocket';
import '../../courtroom/courtroom.css';
import '../../courtroom/components/chat-view.css';

export default function CourtroomView({ user, theme }) {
  const { sessions, loading: sessionsLoading, fetchSessions, createSession, getSession, deleteSession } = useTrialSessions();
  const { connected, messages, subAgentStatus, thinkingSteps, waitingForInput, trialComplete, error, connect, sendMessage, disconnect } = useTrialWebSocket();

  const [view, setView] = useState('setup');
  const [activeSession, setActiveSession] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  async function handleSetupSubmit(formData) {
    setFormLoading(true);
    try {
      const session = await createSession(formData);
      setActiveSession(session);
      setView('trial');
      connect(session.id);
    } catch (e) {
      alert(e.message || 'Failed to start trial');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSelectSession(s) {
    try {
      const full = await getSession(s.id);
      setActiveSession(full);
      setView('trial');
      if (full.status === 'in_progress') {
        connect(full.id);
      } else {
        disconnect();
      }
    } catch (e) {
      alert('Failed to load session');
    }
  }

  function normalizeStoredMessages(rawMessages) {
    if (!rawMessages?.length) return [];
    return rawMessages.map((m) => {
      let type = 'argument';
      if (m.role === 'judge') {
        type = m.phase === 'verdict' ? 'verdict' : 'evaluation';
      }
      return {
        type,
        role: m.role,
        phase: m.phase,
        round: m.round_number,
        content: m.content,
        thinking_steps: m.thinking_steps || [],
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
    disconnect();
    await fetchSessions();
    if (activeSession) {
      setActiveSession(prev => prev ? { ...prev, status: 'paused' } : prev);
    }
  }

  async function handleRetryTrial() {
    if (!activeSession) return;
    disconnect();
    await new Promise(r => setTimeout(r, 300));
    connect(activeSession.id);
  }

  async function handleDeleteSession(id) {
    if (!confirm('Delete this trial?')) return;
    await deleteSession(id);
    if (activeSession?.id === id) handleNewTrial();
  }

  return (
    <div className="courtroom-layout">
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
            subAgentStatus={subAgentStatus}
            thinkingSteps={thinkingSteps}
            waitingForInput={waitingForInput}
            trialComplete={trialComplete || activeSession.status === 'completed'}
            error={error}
            connected={connected}
            onSendArgument={sendMessage}
            onStop={handleStopTrial}
            onRetry={error ? handleRetryTrial : undefined}
          />
        )}
      </main>
    </div>
  );
}
