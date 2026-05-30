'use client';
import { useCallback, useRef, useState } from 'react';
import { buildMockTrialEvents } from '../mock/trialEvents';

const RESEARCH_WORK_EVENT = {
  pipeline: 'system',
  agent_name: 'Research Agent',
};

function appendAgentWork(prev, event) {
  return [
    ...prev,
    {
      type: 'agent_work',
      status: 'running',
      pipeline: event.pipeline,
      agent_name: event.agent_name,
      phase: event.phase,
      round: event.round,
      thinking_steps: event.thinking_steps || [],
      thinking_results: [],
      started_at: Date.now(),
    },
  ];
}

function updateRunningAgentWork(prev, event, updates) {
  const next = [...prev];
  const index = [...next].reverse().findIndex((m) =>
    m.type === 'agent_work' &&
    m.status === 'running' &&
    (!event.pipeline || m.pipeline === event.pipeline) &&
    (!event.agent_name || m.agent_name === event.agent_name)
  );

  if (index === -1) return prev;
  const realIndex = next.length - 1 - index;
  next[realIndex] = { ...next[realIndex], ...updates };
  return next;
}

function stopRunningAgentWork(prev) {
  return prev.map((m) => (
    m.type === 'agent_work' && m.status === 'running'
      ? { ...m, status: 'cancelled', output_summary: 'Mock session paused.' }
      : m
  ));
}

function reduceEvent(prev, event) {
  switch (event.type) {
    case 'trial_started': {
      const rounds = event.num_rounds || 3;
      return [...prev, {
        type: 'status',
        content: `Courtroom simulation started. Reviewing documents for a ${rounds}-round hearing.`,
      }];
    }
    case 'phase_start':
      return [...prev, { type: 'phase_start', phase: event.phase, content: event.content, round: event.round }];
    case 'sub_agent_start':
      return appendAgentWork(prev, event);
    case 'sub_agent_complete':
      return updateRunningAgentWork(prev, event, {
        status: 'complete',
        output_summary: event.output_summary,
        duration_ms: event.duration_ms,
        thinking_results: event.thinking_results || [],
      });
    case 'case_analysis':
      return [...prev, {
        type: 'case_analysis',
        matched: event.matched,
        case_type: event.case_type,
        parties_matched: event.parties_matched,
        case_type_matched: event.case_type_matched,
        shared_parties: event.shared_parties || [],
        issues: event.issues || [],
        reason: event.reason,
      }];
    case 'research_complete': {
      const updated = updateRunningAgentWork(prev, RESEARCH_WORK_EVENT, {
        status: 'complete',
        output_summary: `Knowledge base found ${event.laws_count || 0} laws and ${event.cases_count || 0} cases.`,
        duration_ms: 800,
      });
      return [...updated, {
        type: 'kb_check',
        laws: event.laws || [],
        cases: event.cases || [],
        laws_count: event.laws_count || 0,
        cases_count: event.cases_count || 0,
      }];
    }
    case 'argument':
      return [...prev, { type: 'argument', role: event.agent, phase: event.phase, round: event.round, content: event.content }];
    case 'evaluation':
      return [...prev, { type: 'evaluation', role: 'judge', phase: event.phase, round: event.round, content: event.content }];
    case 'verdict':
      return [...prev, { type: 'verdict', role: 'judge', phase: event.phase, round: event.round, content: event.content, winner: event.winner }];
    default:
      return prev;
  }
}

export function useMockTrial() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(null);
  const [trialComplete, setTrialComplete] = useState(false);
  const [error, setError] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const timersRef = useRef([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const connect = useCallback((sessionId, session = {}) => {
    clearTimers();
    setCurrentSessionId(sessionId);
    setConnected(true);
    setMessages([]);
    setTrialComplete(false);
    setWaitingForInput(null);
    setError(null);

    const events = buildMockTrialEvents({ rounds: session.num_rounds || 3 });
    let delay = 0;
    events.forEach((event) => {
      delay += event.type === 'sub_agent_start' ? 220 : 420;
      const timer = setTimeout(() => {
        if (event.type === 'trial_complete') {
          setTrialComplete(true);
          setConnected(false);
          return;
        }
        setMessages((prev) => reduceEvent(prev, event));
      }, delay);
      timersRef.current.push(timer);
    });
  }, [clearTimers]);

  const disconnect = useCallback(() => {
    clearTimers();
    setConnected(false);
    setCurrentSessionId(null);
  }, [clearTimers]);

  const stopSession = useCallback(() => {
    clearTimers();
    setConnected(false);
    setWaitingForInput(null);
    setCurrentSessionId(null);
    setMessages((prev) => stopRunningAgentWork(prev));
  }, [clearTimers]);

  const sendMessage = useCallback((content) => {
    setWaitingForInput(null);
    setMessages((prev) => [...prev, { type: 'argument', role: 'human', content }]);
  }, []);

  return {
    connected,
    currentSessionId,
    messages,
    waitingForInput,
    trialComplete,
    error,
    connect,
    sendMessage,
    disconnect,
    stopSession,
  };
}
