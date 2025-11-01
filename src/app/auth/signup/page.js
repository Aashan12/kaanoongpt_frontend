'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Settings, Mail, Lock, Eye, EyeOff, ChevronRight, User, Calendar, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './page.css';
import { apiRequest, API_URL } from '../../lib/api';
export default function SignUp() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    date_of_birth: '',
    organization_type: 'law_firm',
    organization_name: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (!formData.date_of_birth) {
      setError('Date of birth is required');
      return false;
    }
    if (!formData.organization_name.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 Sending signup request...');
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      console.log('✅ OTP sent to email!');
      
      // Store form data temporarily (we'll need it for final verification)
      sessionStorage.setItem('signupData', JSON.stringify(formData));
      
      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
      
    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/google/authorize`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError(`Failed to start Google signup: ${err.message}`);
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="signup-container">
      <Link href="/" className="back-btn">
        <ArrowLeft size={24} strokeWidth={2} />
      </Link>

      <div className="logo-section">
        <img src="/logo.jpeg" alt="KAANOONGPT" className="logo-img" />
        <h1 className="welcome-title">Create Your Account</h1>
        <p className="welcome-subtitle">Join KAANOONGPT to access AI legal services</p>
      </div>

      <button className="settings-btn">
        <Settings size={24} strokeWidth={2} />
      </button>

      <div className="signup-card">
        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name" className="form-label">Full Name</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input
                type="text"
                id="full_name"
                name="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_of_birth" className="form-label">Date of Birth</label>
            <div className="input-wrapper">
              <Calendar size={20} className="input-icon" />
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
                className="input-field date-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organization_type" className="form-label">Organization Type</label>
            <div className="input-wrapper">
              <Building2 size={20} className="input-icon" />
              <select
                id="organization_type"
                name="organization_type"
                value={formData.organization_type}
                onChange={handleChange}
                required
                className="input-field select-field"
                disabled={loading}
              >
                <option value="law_firm">Law Firm</option>
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organization_name" className="form-label">Organization Name</label>
            <div className="input-wrapper">
              <Building2 size={20} className="input-icon" />
              <input
                type="text"
                id="organization_name"
                name="organization_name"
                placeholder="Enter your organization name"
                value={formData.organization_name}
                onChange={handleChange}
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
                name="password"
                placeholder="Create a password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                disabled={loading}
                minLength={8}
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

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                name="confirm_password"
                placeholder="Confirm your password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                className="input-field"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="toggle-password"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="continue-btn" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Continue'}
            <ChevronRight size={20} />
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button 
            type="button" 
            className="google-btn" 
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <Image src="/google.jpeg" alt="Google" width={20} height={20} className="google-icon" />
            {loading ? 'Loading...' : 'Continue with Google'}
          </button>
        </form>

        <div className="signin-link">
          Already have an account?{' '}
          <Link href="/auth/login" className="link">
            Sign in
          </Link>
        </div>
      </div>

      <div className="footer">
        <p className="text-sm text-gray-400">
          By using this app, you agree to our{' '}
          <Link href="/terms" className="footer-link">Terms</Link> of Service and{' '}
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}