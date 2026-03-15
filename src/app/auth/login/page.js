'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './page.css';
import { apiRequest, API_URL } from '../../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

      login(data.access_token, data.user);

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



  const handleBackClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmBack = () => {
    router.push('/');
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
    <div className="login-wrapper split-layout">
      {/* Global Brand Header */}
      <nav className="master-auth-nav">
        <div className="master-nav-content">
          <Link href="/" className="master-logo-link">
            <img src="/logo.jpeg" alt="KAANOONGPT" />
            <span>KAANOONGPT</span>
          </Link>
        </div>
      </nav>

      <div className="auth-split-container">
        {/* Cinematic Left Sidebar */}
        <aside className="login-sidebar">
          <button className="sidebar-back-btn" onClick={handleBackClick}>
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>

          <video
            autoPlay
            muted
            loop
            playsInline
            className="sidebar-bg-video"
          >
            <source src="/kanoongptAnimation.mp4" type="video/mp4" />
          </video>
          <div className="sidebar-overlay"></div>

          <div className="sidebar-branding">
            <h1>Welcome Back</h1>
            <p>Enter your credentials to access KaanoonGPT</p>
          </div>
        </aside>

        {/* Functional Right Side */}
        <main className="login-main-area">
          {/* Mobile Go Back Button */}
          <button className="mobile-back-btn" onClick={handleBackClick}>
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>

          <div className="login-container">
            <div className="login-content">
              <div className="login-card">
                <div className="card-header">
                  <h2>Enter your credentials</h2>
                  <p>Sign in to access KaanoonGPT</p>
                </div>

                {error && (
                  <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleEmailLogin}>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">EMAIL</label>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
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
                    <label htmlFor="password" className="form-label">PASSWORD</label>
                    <div className="input-wrapper">
                      <Lock size={18} className="input-icon" />
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
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                    <ChevronRight size={18} />
                  </button>
                </form>

                <div className="signin-link">
                  Don't have an account?{' '}
                  <Link href="/auth/signup" className="link">
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer outside card - at bottom */}
          <div className="footer">
            <p>
              By using this app, you agree to our{' '}
              <Link href="/terms" className="footer-link">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>.
            </p>
          </div>
        </main>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Are you sure you want to go back?</h3>
              <p>You'll be missing out on accessing the KaanoonGPT and its features. Are you sure you want to leave?</p>
              <div className="modal-buttons">
                <button className="modal-btn modal-btn-cancel" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className="modal-btn modal-btn-confirm" onClick={handleConfirmBack}>
                  Yes, go back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
