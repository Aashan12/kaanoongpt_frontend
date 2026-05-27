'use client';
import { useState, useRef, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

const RESEARCH_WORK_EVENT = {
  pipeline: 'system',
  agent_name: 'Research Agent',
  phase: 'research',
  round: 0,
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
      ? { ...m, status: 'cancelled', output_summary: 'Session paused by user.' }
      : m
  ));
}

export function useTrialWebSocket() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(null); // { phase, round, research_refs }
  const [trialComplete, setTrialComplete] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  const connect = useCallback((sessionId) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const ws = new WebSocket(`${WS_URL}/api/courtroom/ws/trial?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setMessages([]);
      setTrialComplete(false);
      setError(null);
      // Send session config
      ws.send(JSON.stringify({ session_id: sessionId }));
    };

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      handleEvent(event);
    };

    ws.onerror = () => setError('WebSocket connection error');
    ws.onclose = () => setConnected(false);
  }, []);

  const handleEvent = useCallback((event) => {
    const { type } = event;

    if (type === 'sub_agent_start') {
      setMessages((prev) => appendAgentWork(prev, event));
    } else if (type === 'trial_started') {
      const rounds = event.num_rounds || 3;
      setMessages((prev) => [...prev, {
        type: 'system',
        content: `${rounds} चरणको सुनुवाइका लागि कागजात समीक्षा सुरु भयो।`,
      }]);
    } else if (type === 'sub_agent_complete') {
      setMessages((prev) => updateRunningAgentWork(prev, event, {
        status: 'complete',
        output_summary: event.output_summary,
        duration_ms: event.duration_ms,
      }));
    } else if (type === 'sub_agent_error') {
      setMessages((prev) => {
        const updated = updateRunningAgentWork(prev, event, {
          status: 'error',
          error: event.error,
        });

        if (updated !== prev) return updated;

        return [...prev, {
          type: 'agent_work',
          status: 'error',
          pipeline: event.pipeline,
          agent_name: event.agent_name,
          phase: event.phase,
          round: event.round,
          thinking_steps: [],
          error: event.error,
        }];
      });
    } else if (type === 'thinking_step') {
      setMessages((prev) => updateRunningAgentWork(prev, event, {
        thinking_steps: [
          ...(
            [...prev].reverse().find((m) =>
              m.type === 'agent_work' &&
              m.status === 'running' &&
              (!event.pipeline || m.pipeline === event.pipeline) &&
              (!event.agent_name || m.agent_name === event.agent_name)
            )?.thinking_steps || []
          ),
          event.step_text,
        ],
      }));
    } else if (type === 'argument') {
      setMessages((prev) => [...prev, { type: 'argument', role: event.agent, phase: event.phase, round: event.round, content: event.content }]);
    } else if (type === 'evaluation') {
      setMessages((prev) => [...prev, { type: 'evaluation', role: 'judge', phase: event.phase, round: event.round, content: event.content }]);
    } else if (type === 'verdict') {
      setMessages((prev) => [...prev, { type: 'verdict', role: 'judge', content: event.content, winner: event.winner }]);
    } else if (type === 'phase_start') {
      setMessages((prev) => {
        const next = [...prev, { type: 'phase_start', phase: event.phase, content: event.content }];
        if (event.phase === 'research') {
          next.push({
            type: 'agent_work',
            status: 'running',
            pipeline: 'system',
            agent_name: 'Research Agent',
            phase: 'research',
            round: 0,
            thinking_steps: [
              'फिरादपत्र र प्रतिउत्तरपत्र पढ्दै...',
              'मुद्दाको प्रकार पहिचान गर्दै...',
              'सम्बन्धित कानून ज्ञानभण्डारमा खोज्दै...',
            ],
            started_at: Date.now(),
          });
        }
        return next;
      });
    } else if (type === 'research_complete') {
      setMessages((prev) => {
        const updated = updateRunningAgentWork(prev, RESEARCH_WORK_EVENT, {
          status: 'complete',
          output_summary: `Knowledge base found ${event.laws_count || 0} laws and ${event.cases_count || 0} cases.`,
        });

        return [
          ...updated,
          {
            type: 'kb_check',
            laws: event.laws || [],
            cases: event.cases || [],
            laws_count: event.laws_count || 0,
            cases_count: event.cases_count || 0,
          },
        ];
      });
    } else if (type === 'case_analysis') {
      setMessages((prev) => [...prev, {
        type: 'case_analysis',
        matched: event.matched,
        case_type: event.case_type,
        parties_matched: event.parties_matched,
        case_type_matched: event.case_type_matched,
        plaintiff_parties: event.plaintiff_parties || [],
        defendant_parties: event.defendant_parties || [],
        shared_parties: event.shared_parties || [],
        issues: event.issues || [],
        reason: event.reason,
      }]);
    } else if (type === 'waiting_for_input') {
      setWaitingForInput({ phase: event.phase, round: event.round, research_refs: event.research_refs });
    } else if (type === 'trial_complete') {
      setTrialComplete(true);
      setWaitingForInput(null);
    } else if (type === 'session_paused') {
      setWaitingForInput(null);
      setMessages((prev) => stopRunningAgentWork(prev));
    } else if (type === 'trial_error') {
      setError(event.content);
      setTrialComplete(true); // stop the trial
      setWaitingForInput(null);
    } else if (type === 'error') {
      setError(event.content);
    }
  }, []);

  const sendMessage = useCallback((content) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'user_argument', content }));
      setWaitingForInput(null);
      setMessages((prev) => [...prev, { type: 'argument', role: 'human', content }]);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    setConnected(false);
  }, []);

  const stopSession = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'stop_trial' }));
      } catch {
        // Ignore send errors; close below still tears down the client side.
      }
    }
    ws?.close(1000, 'Session paused by user');
    setWaitingForInput(null);
    setConnected(false);
    setMessages((prev) => stopRunningAgentWork(prev));
  }, []);

  return {
    connected,
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
