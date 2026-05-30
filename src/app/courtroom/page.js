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
import { useMockTrial } from './hooks/useMockTrial';
import './courtroom.css';
import './components/chat-view.css';

const COURTROOM_MOCK_MODE = process.env.NEXT_PUBLIC_COURTROOM_MOCK_MODE === 'true';

export default function CourtroomPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  const sessionsApi = useTrialSessions();
  const realTrial = useTrialWebSocket();
  const mockTrial = useMockTrial();
  const {
    fetchSessions,
    createSession,
    getSession,
    deleteSession,
    pauseSession,
  } = sessionsApi;
  const {
    currentSessionId,
    messages,
    waitingForInput,
    trialComplete,
    error,
    connect,
    sendMessage,
    disconnect,
    stopSession,
  } = COURTROOM_MOCK_MODE ? mockTrial : realTrial;
  const sessions = COURTROOM_MOCK_MODE ? [] : sessionsApi.sessions;
  const sessionsLoading = COURTROOM_MOCK_MODE ? false : sessionsApi.loading;

  const [view, setView] = useState('setup'); // 'setup' | 'trial'
  const [activeSession, setActiveSession] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const syncedCompletionRef = useRef(null);

  useEffect(() => {
    if (COURTROOM_MOCK_MODE) return;
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !COURTROOM_MOCK_MODE) fetchSessions();
  }, [user]);

  useEffect(() => {
    if (COURTROOM_MOCK_MODE) return;
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
      if (COURTROOM_MOCK_MODE) {
        const session = {
          id: `mock-${Date.now()}`,
          case_name: formData.case_name || 'Mock Court Session',
          case_type: formData.case_type || 'सम्बन्ध विच्छेद',
          court_type: formData.court_type || 'district',
          court_type_name: formData.court_type_name || 'Mock District Court',
          num_rounds: 1,
          status: 'in_progress',
          plaintiff_position: formData.plaintiff_position,
          defendant_position: formData.defendant_position,
          messages: [],
          sub_agent_traces: [],
          ui_events: [],
          research_results: { laws: [], cases: [] },
        };

        setActiveSession(session);
        setView('trial');
        window.setTimeout(() => connect(session.id, session), 0);
        return;
      }

      const session = await createSession({ ...formData, num_rounds: 1 });
      const fullSession = await getSession(session.id).catch(() => session);
      setActiveSession(fullSession);
      setView('trial');
      connect(session.id);
      await fetchSessions();
    } catch (e) {
      console.error('Failed to start courtroom session:', e);
      alert(e.message || 'Failed to start courtroom session');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSelectSession(s) {
    if (COURTROOM_MOCK_MODE) return;
    try {
      const full = await getSession(s.id);
      setActiveSession(full);
      setView('trial');
      // Only connect WebSocket for in-progress trials
      if (full.status === 'in_progress') {
        connect(full.id);
      } else {
        // Saved history should render from stored session data, not stale live hook messages.
        disconnect();
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }

  // Normalize stored TrialMessage/SubAgentTrace objects to the shape ChatView expects.
  function timeValue(item) {
    const value = new Date(item?.timestamp || 0).getTime();
    return Number.isNaN(value) ? 0 : value;
  }

  function markHistoryReplay(message) {
    return { ...message, history_replay: true };
  }

  function traceAgentKey(item = {}) {
    return [
      item.pipeline || '',
      item.agent_name || '',
      item.phase || '',
      item.round ?? item.round_number ?? 0,
    ].join('::');
  }

  function messageKey(item = {}) {
    return [
      item.type || '',
      item.role || '',
      item.phase || '',
      item.round ?? item.round_number ?? 0,
      item.content || '',
    ].join('::');
  }

  function updateStoredAgentWork(transcript, event, updates) {
    const index = [...transcript].reverse().findIndex((m) =>
      m.type === 'agent_work' &&
      (!event.pipeline || m.pipeline === event.pipeline) &&
      (!event.agent_name || m.agent_name === event.agent_name) &&
      (!event.phase || m.phase === event.phase) &&
      (event.round === undefined || event.round === null || m.round === event.round)
    );

    if (index === -1) return false;

    const realIndex = transcript.length - 1 - index;
    transcript[realIndex] = { ...transcript[realIndex], ...updates };
    return true;
  }

  function traceToAgentWork(trace) {
    return markHistoryReplay({
      type: 'agent_work',
      status: trace.status === 'error' ? 'error' : 'complete',
      pipeline: trace.pipeline,
      agent_name: trace.agent_name,
      phase: trace.phase,
      round: trace.round_number,
      thinking_steps: trace.thinking_steps || [],
      thinking_results: trace.thinking_results || [],
      output_summary: trace.output_summary || '',
      duration_ms: trace.duration_ms,
      citations: trace.citations || [],
      event_payload: trace.event_payload || {},
      timestamp: trace.timestamp,
    });
  }

  function findStatementTrace(rawTraces = [], role, phase, round) {
    return [...(rawTraces || [])].reverse().find((trace) => (
      trace?.agent_name === 'Statement Prep' &&
      trace?.pipeline === role &&
      trace?.phase === phase &&
      Number(trace?.round_number || 0) === Number(round || 0)
    ));
  }

  function traceThinkingSteps(trace) {
    if (!trace) return [];
    const steps = [
      ...(trace.thinking_results || []),
      ...(trace.thinking_steps || []),
    ].filter(Boolean);
    return [...new Set(steps)];
  }

  function findStoredMessage(rawMessages = [], role, phase, round, content = '') {
    return [...(rawMessages || [])].reverse().find((message) => (
      message?.role === role &&
      message?.phase === phase &&
      Number(message?.round_number || 0) === Number(round || 0) &&
      (!content || message?.content === content)
    ));
  }

  function savedThinkingSteps(message) {
    return (message?.thinking_steps || []).filter(Boolean);
  }

  function mergeTraceAgentWorks(transcript, rawTraces = []) {
    const existing = new Set(
      transcript
        .filter((item) => item.type === 'agent_work')
        .map(traceAgentKey)
    );

    rawTraces.forEach((trace) => {
      const item = traceToAgentWork(trace);
      const key = traceAgentKey(item);
      if (existing.has(key)) return;
      existing.add(key);
      transcript.push(item);
    });

    return transcript;
  }

  function mergeStoredMessages(transcript, rawMessages = [], rawTraces = []) {
    const existing = new Set(
      transcript
        .filter((item) => ['argument', 'evaluation', 'verdict'].includes(item.type))
        .map(messageKey)
    );

    rawMessages.forEach((m) => {
      let type = 'argument';
      if (m.role === 'judge') {
        type = m.phase === 'verdict' ? 'verdict' : 'evaluation';
      }
      const statementTrace = findStatementTrace(rawTraces, m.role, m.phase, m.round_number);
      const thinkingSteps = traceThinkingSteps(statementTrace);
      const item = markHistoryReplay({
        type,
        role: m.role,
        phase: m.phase,
        round: m.round_number,
        content: m.content,
        thinking_steps: thinkingSteps.length ? thinkingSteps : savedThinkingSteps(m),
        winner: m.phase === 'verdict' ? (activeSession?.winner || null) : null,
        timestamp: m.timestamp,
      });
      const key = messageKey(item);
      if (existing.has(key)) {
        const existingIndex = transcript.findIndex((entry) => messageKey(entry) === key);
        if (
          existingIndex !== -1 &&
          !(transcript[existingIndex].thinking_steps || []).length &&
          (item.thinking_steps || []).length
        ) {
          transcript[existingIndex] = {
            ...transcript[existingIndex],
            thinking_steps: item.thinking_steps,
          };
        }
        return;
      }
      existing.add(key);
      transcript.push(item);
    });

    return transcript;
  }

  function normalizeStoredUiEvents(rawEvents = [], rawTraces = [], rawMessages = []) {
    const transcript = [];

    rawEvents.forEach((event) => {
      const type = event.type;

      if (type === 'trial_started') {
        transcript.push({
          type: 'status',
          content: 'Courtroom simulation started. Reviewing documents for opening, counter exchange, closing, and verdict.',
          timestamp: event.timestamp,
          history_replay: true,
        });
        return;
      }

      if (type === 'system' || type === 'phase_start' || type === 'case_analysis' || type === 'kb_check') {
        transcript.push(markHistoryReplay(event));
        return;
      }

      if (type === 'sub_agent_start') {
        transcript.push({
          type: 'agent_work',
          status: 'running',
          pipeline: event.pipeline,
          agent_name: event.agent_name,
          phase: event.phase,
          round: event.round,
          thinking_steps: event.thinking_steps || [],
          thinking_results: event.thinking_results || [],
          timestamp: event.timestamp,
          history_replay: true,
        });
        return;
      }

      if (type === 'sub_agent_complete') {
        const didUpdate = updateStoredAgentWork(transcript, event, {
          status: 'complete',
          output_summary: event.output_summary,
          duration_ms: event.duration_ms,
          thinking_results: event.thinking_results || [],
          timestamp: event.timestamp,
        });
        if (!didUpdate) {
          transcript.push({
            type: 'agent_work',
            status: 'complete',
            pipeline: event.pipeline,
            agent_name: event.agent_name,
            phase: event.phase,
            round: event.round,
            thinking_steps: event.thinking_steps || [],
            thinking_results: event.thinking_results || [],
            output_summary: event.output_summary,
            duration_ms: event.duration_ms,
            timestamp: event.timestamp,
            history_replay: true,
          });
        }
        return;
      }

      if (type === 'thinking_step') {
        const current = [...transcript].reverse().find((m) =>
          m.type === 'agent_work' &&
          (!event.pipeline || m.pipeline === event.pipeline) &&
          (!event.agent_name || m.agent_name === event.agent_name)
        );
        updateStoredAgentWork(transcript, event, {
          thinking_steps: [...(current?.thinking_steps || []), event.step_text],
          timestamp: event.timestamp,
        });
        return;
      }

      if (type === 'sub_agent_error') {
        const didUpdate = updateStoredAgentWork(transcript, event, {
          status: 'error',
          error: event.error,
          timestamp: event.timestamp,
        });
        if (!didUpdate) {
          transcript.push({
            type: 'agent_work',
            status: 'error',
            pipeline: event.pipeline,
            agent_name: event.agent_name,
            phase: event.phase,
            round: event.round,
            thinking_steps: [],
            error: event.error,
            timestamp: event.timestamp,
            history_replay: true,
          });
        }
        return;
      }

      if (type === 'research_complete') {
        updateStoredAgentWork(transcript, {
          pipeline: 'system',
          agent_name: 'Research Agent',
        }, {
          status: 'complete',
          output_summary: `Knowledge base found ${event.laws_count || 0} laws and ${event.cases_count || 0} cases.`,
          thinking_results: [
            'दुवै कागजातबाट सम्बन्ध विच्छेद तथा भरणपोषण विवाद पुष्टि भयो।',
            'मुद्दा: सम्बन्ध विच्छेद तथा भरणपोषण',
            `प्रमाणित स्रोत: ${event.laws_count || 0} statutes · ${event.cases_count || 0} cases`,
          ],
          timestamp: event.timestamp,
        });
        transcript.push({
          type: 'kb_check',
          laws: event.laws || [],
          cases: event.cases || [],
          laws_count: event.laws_count || 0,
          cases_count: event.cases_count || 0,
          timestamp: event.timestamp,
          history_replay: true,
        });
        return;
      }

      if (type === 'argument') {
        const statementTrace = findStatementTrace(rawTraces, event.agent, event.phase, event.round);
        const storedMessage = findStoredMessage(rawMessages, event.agent, event.phase, event.round, event.content);
        const thinkingSteps = traceThinkingSteps(statementTrace);
        transcript.push({
          type: 'argument',
          role: event.agent,
          phase: event.phase,
          round: event.round,
          content: event.content,
          thinking_steps: thinkingSteps.length ? thinkingSteps : savedThinkingSteps(storedMessage),
          stream_id: event.stream_id,
          timestamp: event.timestamp,
          history_replay: true,
        });
        return;
      }

      if (type === 'evaluation') {
        transcript.push({
          type: 'evaluation',
          role: 'judge',
          phase: event.phase,
          round: event.round,
          content: event.content,
          timestamp: event.timestamp,
          history_replay: true,
        });
        return;
      }

      if (type === 'verdict') {
        transcript.push({
          type: 'verdict',
          role: 'judge',
          content: event.content,
          winner: event.winner,
          timestamp: event.timestamp,
          history_replay: true,
        });
        return;
      }

      if (type === 'trial_error' || type === 'error') {
        transcript.push({
          type: 'trial_error',
          content: event.content,
          timestamp: event.timestamp,
          history_replay: true,
        });
      }
    });

    mergeTraceAgentWorks(transcript, rawTraces);
    mergeStoredMessages(transcript, rawMessages, rawTraces);
    return transcript.sort((a, b) => timeValue(a) - timeValue(b));
  }

  function normalizeStoredMessages(rawMessages, rawTraces = []) {
    const hasTraces = rawTraces?.length > 0;
    const transcript = [];

    if (hasTraces) {
      mergeTraceAgentWorks(transcript, rawTraces);
    }

    if (!rawMessages?.length) {
      return transcript.sort((a, b) => timeValue(a) - timeValue(b));
    }

    transcript.push(...rawMessages.map((m) => {
      // Determine type from role + phase
      let type = 'argument';
      if (m.role === 'judge') {
        type = m.phase === 'verdict' ? 'verdict' : 'evaluation';
      }
      const statementTrace = findStatementTrace(rawTraces, m.role, m.phase, m.round_number);
      const thinkingSteps = traceThinkingSteps(statementTrace);
      return {
        type,
        role: m.role,
        phase: m.phase,
        round: m.round_number,          // rename round_number → round
        content: m.content,
        thinking_steps: hasTraces
          ? (thinkingSteps.length ? thinkingSteps : savedThinkingSteps(m))
          : savedThinkingSteps(m),
        // For verdict messages, pull winner from session-level field
        winner: m.phase === 'verdict' ? (activeSession?.winner || null) : null,
        timestamp: m.timestamp,
        history_replay: true,
      };
    }));

    return transcript.sort((a, b) => timeValue(a) - timeValue(b));
  }

  function getDisplayMessages() {
    const isLiveActiveSession = Boolean(
      activeSession?.id &&
      activeSession.status === 'in_progress' &&
      currentSessionId === activeSession.id
    );
    if (isLiveActiveSession && messages.length > 0) return messages;
    if (activeSession?.ui_events?.length) {
      const replay = normalizeStoredUiEvents(
        activeSession.ui_events,
        activeSession.sub_agent_traces,
        activeSession.messages
      );
      if (replay.some((m) => m.type === 'agent_work')) return replay;

      const traceReplay = normalizeStoredMessages(activeSession.messages, activeSession.sub_agent_traces);
      if (traceReplay.some((m) => m.type === 'agent_work')) return traceReplay;
      return replay;
    }
    return normalizeStoredMessages(activeSession.messages, activeSession.sub_agent_traces);
  }

  function handleNewTrial() {
    disconnect();
    setActiveSession(null);
    setView('setup');
  }

  async function handleStopTrial() {
    stopSession();
    if (activeSession && !COURTROOM_MOCK_MODE) {
      setActiveSession(prev => prev ? { ...prev, status: 'paused' } : prev);
      await pauseSession(activeSession.id).catch(() => null);
      const full = await getSession(activeSession.id).catch(() => null);
      if (full) setActiveSession(full);
    }
    // Refresh sessions so sidebar shows updated status
    if (!COURTROOM_MOCK_MODE) await fetchSessions();
  }

  async function handleRetryTrial() {
    if (!activeSession) return;
    disconnect();
    // Small delay to let WS close cleanly
    await new Promise(r => setTimeout(r, 300));
    connect(activeSession.id, activeSession);
  }

  async function handleDeleteSession(id) {
    if (COURTROOM_MOCK_MODE) return;
    if (!confirm('Delete this session?')) return;
    await deleteSession(id);
    if (activeSession?.id === id) handleNewTrial();
  }

  if (!COURTROOM_MOCK_MODE && authLoading) return <div className="courtroom-loading">Loading...</div>;

  return (
    <div className={`courtroom-layout ${theme}`}>
      <SessionSidebar
        sessions={sessions}
        loading={sessionsLoading}
        onSelect={handleSelectSession}
        onNew={handleNewTrial}
        onDelete={handleDeleteSession}
        activeId={activeSession?.id}
        onLoad={COURTROOM_MOCK_MODE ? () => {} : fetchSessions}
      />

      <main className="courtroom-main">
        {view === 'setup' && (
          <div className="setup-container">
            <SetupForm onSubmit={handleSetupSubmit} loading={formLoading} mockMode={COURTROOM_MOCK_MODE} />
          </div>
        )}

        {view === 'trial' && activeSession && (
          (() => {
            const isLiveActiveSession = Boolean(
              activeSession?.id &&
              activeSession.status === 'in_progress' &&
              currentSessionId === activeSession.id
            );
            return (
          <ChatView
            session={activeSession}
            messages={getDisplayMessages()}
            historyReplay={!isLiveActiveSession}
            waitingForInput={waitingForInput}
            trialComplete={trialComplete || activeSession.status === 'completed'}
            error={error}
            onSendArgument={sendMessage}
            onStop={handleStopTrial}
            onRetry={error ? handleRetryTrial : undefined}
            onReplay={handleRetryTrial}
          />
            );
          })()
        )}
      </main>
    </div>
  );
}
