'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './page.css';
import { apiRequest, API_URL } from '../../lib/api';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ Already authenticated, redirecting...');
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Starting email/password login...');
      console.log('📧 Email:', email);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        // Handle specific error messages
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        } else if (response.status === 403) {
          throw new Error(data.detail || 'Please verify your email before logging in');
        } else {
          throw new Error(data.detail || 'Login failed');
        }
      }

      console.log('✅ Login successful!');
      console.log('🔑 Token:', data.access_token.substring(0, 20) + '...');
      console.log('👤 User:', data.user);

      // Use the login function from AuthContext
      login(data.access_token, data.user);

      // Small delay to ensure state updates
      setTimeout(() => {
        console.log('🚀 Redirecting to dashboard...');
        router.push('/dashboard');
      }, 100);

    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      console.log('Starting Google login...');
      const response = await fetch(`${API_URL}/auth/google/authorize`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.authorization_url) {
        console.log('Redirecting to Google...');
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(`Failed to start Google login: ${err.message}`);
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: 'white'
      }}>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <Link href="/" className="back-btn">
        <ArrowLeft size={24} strokeWidth={2} />
      </Link>

      <div className="logo-section">
        <img src="/logo.jpeg" alt="KAANOONGPT" className="logo-img" />
        <h1 className="welcome-title">Welcome Back</h1>
        <p className="welcome-subtitle">Sign in to continue to KAANOONGPT</p>
      </div>

      <button className="settings-btn">
        <Settings size={24} strokeWidth={2} />
      </button>

      <div className="login-card">
        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="forgot-password-link">
            <Link href="/auth/forgot-password" className="link-text">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="continue-btn" disabled={loading}>
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ChevronRight size={20} />
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button 
            type="button" 
            className="google-btn" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Loading...' : 'Continue with Google'}
          </button>
        </form>

        <div className="signin-link">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="link">
            Sign up
          </Link>
        </div>
      </div>

      <div className="footer">
        <p>
          By using this app, you agree to our{' '}
          <Link href="/terms" className="footer-link">Terms</Link> of Service and{' '}
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );}