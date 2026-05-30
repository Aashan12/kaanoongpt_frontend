'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, API_URL } from '../lib/api';
const AuthContext = createContext();
const AUTH_MOCK_MODE = process.env.NEXT_PUBLIC_AUTH_MOCK_MODE === 'true';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Memoized checkAuth to prevent infinite loops
  const checkAuth = useCallback(async () => {
    if (AUTH_MOCK_MODE) {
      setUser({
        id: 'mock-user',
        email: 'ui-preview@kanoongpt.local',
        full_name: 'UI Preview',
        name: 'UI Preview',
        country: 'NP',
      });
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking authentication...');
      const response = await fetch(`${API_URL}/api/kanoongpt/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User authenticated:', userData.email);
        setUser(userData);
      } else {
        console.log('❌ Token invalid, clearing...');
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Empty deps - function never changes

  // ✅ Memoized login function
  const login = useCallback(async (token, providedUser = null) => {
    console.log('🔐 AuthContext: login called');
    localStorage.setItem('access_token', token);
    if (providedUser) {
      setUser(providedUser);
      setLoading(false);
      router.push('/assistant');
      return;
    }
    console.log('💾 Token saved to localStorage');
    
    try {
      // Fetch user data immediately
      const response = await fetch(`${API_URL}/api/kanoongpt/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data fetched:', userData.email);
        setUser(userData);
        setLoading(false);
        
        // Redirect after setting user
        console.log('🚀 Redirecting to assistant...');
        router.push('/assistant');
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      localStorage.removeItem('access_token');
      throw error;
    }
  }, [router]);

  // ✅ Memoized logout function
  const logout = useCallback(() => {
    console.log('👋 Logging out...');
    localStorage.removeItem('access_token');
    setUser(null);
    router.push('/');
  }, [router]);

  // ✅ Check auth ONCE on mount
  useEffect(() => {
    console.log('🔄 AuthProvider mounted, checking auth...');
    checkAuth();
  }, [checkAuth]); // ✅ Only re-run if checkAuth changes (which it won't)

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
