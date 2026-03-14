'use client';
import { useState, useRef, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useTrialWebSocket() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [subAgentStatus, setSubAgentStatus] = useState(null); // { pipeline, agent_name }
  const [thinkingSteps, setThinkingSteps] = useState([]); // current agent thinking
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
      setSubAgentStatus({ pipeline: event.pipeline, agent_name: event.agent_name });
      setThinkingSteps([]);
    } else if (type === 'sub_agent_complete') {
      setSubAgentStatus(null);
    } else if (type === 'sub_agent_error') {
      setSubAgentStatus(null);
      setMessages((prev) => [...prev, {
        type: 'sub_agent_error',
        pipeline: event.pipeline,
        agent_name: event.agent_name,
        content: event.error,
      }]);
    } else if (type === 'thinking_step') {
      setThinkingSteps((prev) => [...prev, event.step_text]);
    } else if (type === 'thinking_complete') {
      setThinkingSteps([]);
    } else if (type === 'argument') {
      setMessages((prev) => [...prev, { type: 'argument', role: event.agent, phase: event.phase, round: event.round, content: event.content }]);
    } else if (type === 'evaluation') {
      setMessages((prev) => [...prev, { type: 'evaluation', role: 'judge', phase: event.phase, round: event.round, content: event.content }]);
    } else if (type === 'verdict') {
      setMessages((prev) => [...prev, { type: 'verdict', role: 'judge', content: event.content, winner: event.winner }]);
    } else if (type === 'phase_start') {
      setMessages((prev) => [...prev, { type: 'phase_start', phase: event.phase, content: event.content }]);
    } else if (type === 'research_complete') {
      setMessages((prev) => [...prev, { type: 'research_complete', laws: event.laws, cases: event.cases, laws_count: event.laws_count, cases_count: event.cases_count }]);
    } else if (type === 'waiting_for_input') {
      setWaitingForInput({ phase: event.phase, round: event.round, research_refs: event.research_refs });
    } else if (type === 'trial_complete') {
      setTrialComplete(true);
      setWaitingForInput(null);
    } else if (type === 'trial_error') {
      setError(event.content);
      setTrialComplete(true); // stop the trial
      setSubAgentStatus(null);
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

  return {
    connected,
    messages,
    subAgentStatus,
    thinkingSteps,
    waitingForInput,
    trialComplete,
    error,
    connect,
    sendMessage,
    disconnect,
  };
}
