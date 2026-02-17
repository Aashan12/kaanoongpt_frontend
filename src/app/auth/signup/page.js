'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Lock, Eye, EyeOff, ChevronRight,
  User, Calendar, Building2, Globe, FileUp, Phone,
  MapPin, CheckCircle2, ShieldCheck, Map as MapIcon,
  Search, Crosshair, ArrowLeft
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

  const [showMapPicker, setShowMapPicker] = useState(true); // Changed from false to true
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
    fetchUserTypes();
    fetchCountries();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (currentStep === 2 && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [currentStep, showMapPicker]);

  const initializeMap = () => {
    if (window.google) {
      setTimeout(setupMap, 200);
      return;
    }
    const script = document.createElement('script');
    const hardcodedKey = 'AIzaSyAcT4M-vlZ8p9Bo8rK2n2oaIePKzk-G_lo';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || hardcodedKey}&libraries=places`;
    script.async = true;
    script.onload = () => setTimeout(setupMap, 200);
    document.head.appendChild(script);
  };

  const setupMap = () => {
    if (!mapRef.current) return;

    const defaultCenter = { lat: formData.latitude, lng: formData.longitude };
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 16,
      center: defaultCenter,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });

    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map: map,
      draggable: true,
      title: 'Herald College Kathmandu'
    });

    // Add Autocomplete logic for Map Search
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInput);
      autocomplete.bindTo('bounds', map);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }

        marker.setPosition(place.geometry.location);
        setFormData(prev => ({
          ...prev,
          city: place.name || prev.city,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }));
      });
    }

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      setFormData(prev => ({ ...prev, latitude: pos.lat(), longitude: pos.lng() }));
    });

    map.addListener('click', (e) => {
      const pos = e.latLng;
      marker.setPosition(pos);
      setFormData(prev => ({ ...prev, latitude: pos.lat(), longitude: pos.lng() }));
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/system-setup/countries/`);
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchStates = async (countryId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/system-setup/states/by-country/${countryId}`);
      if (response.ok) {
        const data = await response.json();
        setStates(data);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/system-setup/cities/by-state/${stateId}`);
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const fetchUserTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/system-setup/user-types/`);
      if (response.ok) {
        const data = await response.json();
        const activeTypes = data.filter(t => t.is_active);
        setUserTypes(activeTypes);
        if (activeTypes.length > 0 && !formData.organization_type) {
          setFormData(prev => ({ ...prev, organization_type: activeTypes[0].code }));
        }
      }
    } catch (err) {
      console.error('Error fetching user types:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'country') {
      const selectedCountry = countries.find(c => (c.id || c._id) === value);
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
      const selectedState = states.find(s => (s.id || s._id) === value);
      if (selectedState) {
        setFormData(prev => ({
          ...prev,
          state: selectedState.name,
          city: '',
          latitude: selectedState.latitude || prev.latitude,
          longitude: selectedState.longitude || prev.longitude
        }));

        // Update map if state has coords
        if (selectedState.latitude && selectedState.longitude && markerRef.current) {
          const newPos = { lat: selectedState.latitude, lng: selectedState.longitude };
          markerRef.current.setPosition(newPos);
          mapInstanceRef.current.setCenter(newPos);
        }

        setCities([]);
        fetchCities(selectedState.id || selectedState._id);
      } else {
        setFormData(prev => ({ ...prev, state: '', city: '' }));
      }
    }
    else if (name === 'city') {
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
      const response = await fetch(`${API_URL}/api/kanoongpt/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Signup failed');

      sessionStorage.setItem('signupData', JSON.stringify(formData));
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
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
              value={countries.find(c => c.name === formData.country)?.id || countries.find(c => c.name === formData.country)?._id || ''}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Country</option>
              {countries.map(c => <option key={c.id || c._id || c.code} value={c.id || c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="wizard-field">
          <label className="form-label">State / Province</label>
          <div className="input-wrapper">
            <MapPin size={18} className="input-icon" />
            <select
              name="state"
              value={states.find(s => s.name === formData.state)?.id || states.find(s => s.name === formData.state)?._id || ''}
              onChange={handleChange}
              disabled={!formData.country}
              className="input-field"
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="wizard-field full-width">
          <label className="form-label">City / Exact Location</label>
          <div className="input-wrapper">
            <MapIcon size={18} className="input-icon" />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. Kathmandu, Baneshwor"
              disabled={!formData.state}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="map-integration-container">
        <div className="map-controls-pnl">
          <div className="coord-info">
            <div className="coord-chip">Lat: <span>{formData.latitude.toFixed(6)}</span></div>
            <div className="coord-chip">Lng: <span>{formData.longitude.toFixed(6)}</span></div>
          </div>
        </div>

        <div className="map-picker-portal animate-fade-in">
          <div className="map-search-box">
            <Search size={18} />
            <input id="map-search-input" type="text" placeholder="Search your specific location..." />
          </div>
          <div ref={mapRef} id="google-signup-map" className="google-map-node"></div>
          <div className="map-hint">Click on map or drag marker to set exact location</div>
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
              {userTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
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
