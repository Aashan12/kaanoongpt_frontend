'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Lock, Eye, EyeOff, ChevronRight,
  User, Calendar, Building2, Globe, FileUp, Phone,
  MapPin, CheckCircle2, ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './page.css';
import { API_URL } from '../../lib/api';

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    organization_type: '',
    organization_name: '',
    country: '',
    state: '',
    city: '',
    latitude: 27.712177,
    longitude: 85.331112,
    password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Data lists
  const [userTypes, setUserTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [file, setFile] = useState(null);

  // Map removed - no longer needed

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
    fetchUserTypes();
    fetchCountries();
  }, [isAuthenticated, router]);

  // Map initialization removed

  const fetchCountries = async () => {
    try {
      console.log('Fetching countries from:', `${API_URL}/api/admin/system-setup/countries/`);
      const response = await fetch(`${API_URL}/api/admin/system-setup/countries/`);
      console.log('Countries response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Countries data received:', data);
        // Extract the data array from the paginated response
        const countriesArray = data.data || data;
        setCountries(Array.isArray(countriesArray) ? countriesArray : []);
      } else {
        console.error('Countries fetch failed with status:', response.status);
        setCountries([]);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
      setCountries([]);
    }
  };

  const fetchStates = async (countryId) => {
    try {
      console.log('Fetching states for country:', countryId);
      const response = await fetch(`${API_URL}/api/admin/system-setup/states/by-country/${countryId}`);
      console.log('States response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('States data received:', data);
        // States API returns direct array, not paginated
        setStates(Array.isArray(data) ? data : []);
      } else {
        console.error('States fetch failed with status:', response.status);
        setStates([]);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
      setStates([]);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      console.log('Fetching cities for state:', stateId);
      const response = await fetch(`${API_URL}/api/admin/system-setup/cities/by-state/${stateId}`);
      console.log('Cities response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Cities data received:', data);
        // Cities API returns direct array, not paginated
        setCities(Array.isArray(data) ? data : []);
      } else {
        console.error('Cities fetch failed with status:', response.status);
        setCities([]);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      setCities([]);
    }
  };

  const fetchUserTypes = async () => {
    try {
      console.log('Fetching user types from:', `${API_URL}/api/admin/system-setup/user-types/`);
      const response = await fetch(`${API_URL}/api/admin/system-setup/user-types/`);
      console.log('User types response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('User types data received:', data);
        // User types API returns direct array, not paginated
        const userTypesArray = Array.isArray(data) ? data : [];
        const activeTypes = userTypesArray.filter(t => t.is_active);
        setUserTypes(activeTypes);
        if (activeTypes.length > 0 && !formData.organization_type) {
          setFormData(prev => ({ ...prev, organization_type: activeTypes[0].code }));
        }
      } else {
        console.error('User types fetch failed with status:', response.status);
        setUserTypes([]);
      }
    } catch (err) {
      console.error('Error fetching user types:', err);
      setUserTypes([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('handleChange called:', { name, value });

    if (name === 'country') {
      console.log('Available countries:', countries);
      const selectedCountry = Array.isArray(countries) ? countries.find(c => (c.id || c._id) === value) : null;
      console.log('Selected country:', selectedCountry);
      if (selectedCountry) {
        setFormData(prev => ({
          ...prev,
          country: selectedCountry.name,
          state: '',
          city: ''
        }));
        setStates([]);
        setCities([]);
        fetchStates(selectedCountry.id || selectedCountry._id);
      } else {
        setFormData(prev => ({ ...prev, country: '', state: '', city: '' }));
      }
    }
    else if (name === 'state') {
      console.log('Available states:', states);
      const selectedState = Array.isArray(states) ? states.find(s => (s._id || s.id) === value) : null;
      console.log('Selected state:', selectedState);
      if (selectedState) {
        // Update coordinates if state has them (map removed)
        if (selectedState.latitude && selectedState.longitude) {
          setFormData(prev => ({
            ...prev,
            state: selectedState.name,
            city: '',
            latitude: selectedState.latitude,
            longitude: selectedState.longitude
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            state: selectedState.name,
            city: ''
          }));
        }

        setCities([]);
        fetchCities(selectedState._id || selectedState.id);
      } else {
        setFormData(prev => ({ ...prev, state: '', city: '' }));
      }
    }
    else if (name === 'city') {
      console.log('City input changed:', value);
      setFormData(prev => ({ ...prev, city: value }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.full_name || !formData.email || !formData.phone_number || !formData.date_of_birth) {
        setError('Please fill all fields');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.country || !formData.state || !formData.city) {
        setError('Please select location details');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    setError('');
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Log the data being sent for debugging
      console.log('Submitting signup data:', formData);
      
      const response = await fetch(`${API_URL}/api/kanoongpt/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Signup response:', data);
      
      if (!response.ok) {
        // Handle validation errors from FastAPI
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // FastAPI validation errors
            const errorMessages = data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
            throw new Error(errorMessages);
          } else if (typeof data.detail === 'string') {
            throw new Error(data.detail);
          } else {
            throw new Error(JSON.stringify(data.detail));
          }
        } else if (data.message) {
          throw new Error(data.message);
        } else {
          throw new Error('Signup failed. Please check your information and try again.');
        }
      }

      sessionStorage.setItem('signupData', JSON.stringify(formData));
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="wizard-step-content animate-fade-in">
      <div className="wizard-step-info">
        <h2>Basic Information</h2>
        <p>Start your journey with KaanoonGPT</p>
      </div>
      <div className="wizard-form-grid">
        <div className="wizard-field">
          <label className="form-label">Full Name</label>
          <div className="input-wrapper">
            <User size={18} className="input-icon" />
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className="input-field"
            />
          </div>
        </div>
        <div className="wizard-field">
          <label className="form-label">Email Address</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="input-field"
            />
          </div>
        </div>
        <div className="wizard-field">
          <label className="form-label">Phone Number</label>
          <div className="input-wrapper">
            <Phone size={18} className="input-icon" />
            <input
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+977 98XXXXXXXX"
              className="input-field"
            />
          </div>
        </div>
        <div className="wizard-field">
          <label className="form-label">Date of Birth</label>
          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>
      </div>
      <button type="button" onClick={nextStep} className="wizard-btn-next">
        Continue <ChevronRight size={18} />
      </button>
      <div className="auth-step-footer">
        Already have an account? <Link href="/auth/login">Sign in</Link>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step-content animate-fade-in location-step">
      <div className="wizard-step-info">
        <h2>Location Details</h2>
        <p>Your jurisdiction helps us customize legal insights</p>
      </div>

      <div className="wizard-form-grid">
        <div className="wizard-field">
          <label className="form-label">Country</label>
          <div className="input-wrapper">
            <Globe size={18} className="input-icon" />
            <select
              name="country"
              value={Array.isArray(countries) ? (countries.find(c => c.name === formData.country)?.id || countries.find(c => c.name === formData.country)?._id || '') : ''}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Country</option>
              {Array.isArray(countries) && countries.map(c => <option key={c.id || c._id || c.code} value={c.id || c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="wizard-field">
          <label className="form-label">State / Province</label>
          <div className="input-wrapper">
            <MapPin size={18} className="input-icon" />
            <select
              name="state"
              value={Array.isArray(states) ? (states.find(s => s.name === formData.state)?._id || states.find(s => s.name === formData.state)?.id || '') : ''}
              onChange={handleChange}
              disabled={!formData.country}
              className="input-field"
            >
              <option value="">Select State</option>
              {Array.isArray(states) && states.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="wizard-field full-width">
          <label className="form-label">City / Exact Location</label>
          <div className="input-wrapper">
            <MapPin size={18} className="input-icon" />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder={formData.state ? "e.g. Kathmandu, Baneshwor" : "Please select a state first"}
              disabled={!formData.state}
              className="input-field"
            />
          </div>
          {!formData.state && (
            <small style={{color: '#888', fontSize: '12px', marginTop: '4px'}}>
              Select a state to enable city input
            </small>
          )}
        </div>
      </div>

      <div className="wizard-btn-row">
        <button type="button" onClick={prevStep} className="wizard-btn-back">Back</button>
        <button type="button" onClick={nextStep} className="wizard-btn-next">Continue</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-step-content animate-fade-in final-security-step">
      <div className="wizard-step-info">
        <h2>Identity & Security</h2>
        <p>Complete your professional profile verification</p>
      </div>

      <div className="wizard-form-grid">
        <div className="wizard-field">
          <label className="form-label">Professional Category</label>
          <div className="input-wrapper">
            <CheckCircle2 size={18} className="input-icon" />
            <select
              name="organization_type"
              value={formData.organization_type}
              onChange={handleChange}
              className="input-field"
            >
              {Array.isArray(userTypes) && userTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="wizard-field">
          <label className="form-label">Firm / Organization Name</label>
          <div className="input-wrapper">
            <Building2 size={18} className="input-icon" />
            <input
              name="organization_name"
              value={formData.organization_name}
              onChange={handleChange}
              placeholder="e.g. Justice Chambers"
              className="input-field"
            />
          </div>
        </div>

        <div className="wizard-field full-width">
          <label className="form-label">Practice Bio / Office Address</label>
          <div className="input-wrapper">
            <MapPin size={18} className="input-icon" />
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              placeholder="Briefly describe your practice or enter office address..."
              className="input-field"
            ></textarea>
          </div>
        </div>

        {formData.organization_type === 'law-firm' && (
          <div className="wizard-field full-width">
            <label><ShieldCheck size={14} /> Professional Verification (Bar License)</label>
            <div className={`premium-upload-zone ${file ? 'has-file' : ''}`}>
              <div className="upload-visual">
                <div className="visual-icon">
                  <FileUp size={28} />
                </div>
                <div className="visual-text">
                  <p>{file ? file.name : 'Click to upload your license'}</p>
                  <span>PDF, PNG or JPG (Max 5MB)</span>
                </div>
              </div>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden-file-input"
                id="bar-license-upload"
              />
              <label htmlFor="bar-license-upload" className="btn-upload-trigger">
                {file ? 'Change File' : 'Browse'}
              </label>
            </div>
          </div>
        )}

        <div className="wizard-field">
          <label className="form-label">Create Password</label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field"
            />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="wizard-field">
          <label className="form-label">Confirm Password</label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field"
            />
            <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="wizard-btn-row">
        <button type="button" onClick={prevStep} className="wizard-btn-back">Return to Location</button>
        <button type="submit" className="wizard-btn-submit" disabled={loading}>
          {loading ? (
            <span className="flex-center gap-2">
              <div className="mini-spinner"></div> Creating Account...
            </span>
          ) : 'Complete Final Step'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="advanced-signup-layout">
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
        <aside className="signup-sidebar">
          <button className="sidebar-back-btn" onClick={() => window.history.back()}>
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
            <h1>Join KaanoonGPT</h1>
            <p>Access AI-powered legal services</p>
          </div>
        </aside>

        {/* Functional Right Side */}
        <main className="signup-main-area">
          {/* Mobile Go Back Button */}
          <button className="mobile-back-btn" onClick={() => window.history.back()}>
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>

          <div className="wizard-top-nav">
            <div className="wizard-logo-static">
              <span>Join KaanoonGPT</span>
            </div>
          </div>

          <div className="wizard-content-flow">
            <div className="wizard-stepper">
              {[1, 2, 3].map(step => (
                <div key={step} className={`wizard-step-node ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'done' : ''}`}>
                  <div className="wizard-node-icon">
                    {currentStep > step ? <CheckCircle2 size={22} /> : step}
                  </div>
                  <div className="wizard-node-text">
                    <span className="node-title">{step === 1 ? 'Personal' : step === 2 ? 'Location' : 'Security'}</span>
                    <span className="node-desc">
                      {step === 1 ? 'About you' : step === 2 ? 'Region & Map' : 'Final Verification'}
                    </span>
                  </div>
                </div>
              ))}
              <div className="wizard-progress-track">
                <div className="wizard-progress-bar" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="wizard-form-wrapper">
            <div className="wizard-card-main">
              {error && <div className="wizard-alert-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </form>
            </div>
            <footer className="wizard-mini-footer">
              <p>© 2024 KaanoonGPT. All rights reserved. <Link href="/terms">Terms</Link> • <Link href="/privacy">Privacy</Link></p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
