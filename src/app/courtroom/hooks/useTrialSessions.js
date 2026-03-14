'use client';
import { useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export function useTrialSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/courtroom/trial/sessions`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data);
      return data;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (payload) => {
    const res = await fetch(`${API_URL}/api/courtroom/trial/sessions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create session');
    }
    const session = await res.json();
    setSessions((prev) => [session, ...prev]);
    return session;
  }, []);

  const getSession = useCallback(async (sessionId) => {
    const res = await fetch(`${API_URL}/api/courtroom/trial/sessions/${sessionId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    const res = await fetch(`${API_URL}/api/courtroom/trial/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete session');
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, []);

  return { sessions, loading, error, fetchSessions, createSession, getSession, deleteSession };
}
