
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import './callback.css';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (!processing) return;
      
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');
      
      console.log('📥 Callback page loaded');
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      console.log('❌ Error:', errorParam || 'None');
      
      if (errorParam) {
        console.error('❌ Authentication error:', errorParam);
        setError('Authentication failed');
        setProcessing(false);
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }
      
      if (token) {
        console.log('✅ Token received, logging in...');
        try {
          await login(token);
          console.log('✅ Login successful!');
          // login() already redirects, so we're done
        } catch (err) {
          console.error('❌ Login error:', err);
          setError('Failed to complete login');
          setProcessing(false);
          setTimeout(() => router.push('/auth/login'), 3000);
        }
        return;
      }
      
      // No token and no error - something went wrong
      console.error('❌ No token or error in URL');
      setError('Authentication incomplete');
      setProcessing(false);
      setTimeout(() => router.push('/auth/login'), 3000);
    };

    handleCallback();
  }, [processing, searchParams, login, router]);

  return (
    <div className="callback-container">
      <div className="callback-content">
        {error ? (
          <div className="callback-error">
            <p className="error-title">❌ {error}</p>
            <p className="error-subtitle">Redirecting to login...</p>
          </div>
        ) : (
          <div className="callback-success">
            <div className="spinner"></div>
            <p className="success-title">Completing sign in...</p>
            <p className="success-subtitle">Please wait</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="callback-container">
        <div className="callback-content">
          <div className="callback-success">
            <div className="spinner"></div>
            <p className="success-title">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}