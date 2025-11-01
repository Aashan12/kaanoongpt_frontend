'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './page.css';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  
  const inputRefs = useRef([]);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email in URL, redirect back to signup
      router.push('/auth/signup');
    }

    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [searchParams, router]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or next empty one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Verifying OTP...');

      // Get signup data from sessionStorage
      const signupDataStr = sessionStorage.getItem('signupData');
      if (!signupDataStr) {
        throw new Error('Session expired. Please sign up again.');
      }

      const signupData = JSON.parse(signupDataStr);

      // Send OTP verification request
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otpCode,
          ...signupData // Include all signup data
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Invalid OTP');
      }

      console.log('✅ OTP verified! User saved to database.');

      // Clear signup data from sessionStorage
      sessionStorage.removeItem('signupData');

      // Login with the token received
      if (data.access_token) {
        login(data.access_token);
        console.log('✅ Logged in successfully!');
        
        // Show success message briefly before redirect
        alert('Account verified successfully! Welcome to KAANOONGPT!');
        router.push('/dashboard');
      } else {
        // If no token, redirect to login
        alert('Account verified! Please login to continue.');
        router.push('/auth/login');
      }

    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError('');

    try {
      console.log('📧 Resending OTP...');

      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to resend OTP');
      }

      console.log('✅ OTP resent successfully!');
      alert('New OTP sent to your email!');
      
      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } catch (err) {
      console.error('❌ Resend OTP error:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="otp-container">
      {/* Top Navigation */}
      <div className="top-nav">
        <Link href="/auth/signup" className="back-btn">
          <ArrowLeft size={24} strokeWidth={2} />
        </Link>
      </div>

      <div className="otp-card">
        <div className="otp-header">
          <div className="icon-container">
            <Mail size={48} className="mail-icon" />
          </div>
          <h1 className="otp-title">Verify Your Email</h1>
          <p className="otp-subtitle">
            We've sent a 6-digit code to<br />
            <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="otp-input-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="otp-input"
              disabled={loading}
            />
          ))}
        </div>

        <button 
          onClick={handleVerify} 
          className="verify-btn"
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className="resend-section">
          {!canResend ? (
            <p className="resend-text">
              Resend code in <strong>{resendTimer}s</strong>
            </p>
          ) : (
            <button 
              onClick={handleResend} 
              className="resend-btn"
              disabled={resendLoading}
            >
              <RefreshCw size={16} className={resendLoading ? 'spin' : ''} />
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>

        <div className="help-text">
          <p>Didn't receive the code? Check your spam folder or try resending.</p>
        </div>
      </div>

      <div className="footer">
        <p>
          Need help?{' '}
          <Link href="/support" className="footer-link">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}