'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LogOut, Gavel, MessageSquare, BarChart3, Mail, Calendar, Building2, User, X, LayoutDashboard, Settings } from 'lucide-react';
import Image from 'next/image';
import './dashboard.css';
export default function Dashboard() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    console.log('Dashboard useEffect - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user);

    if (loading) return;

    if (!isAuthenticated || !user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/auth/login');
    } else {
      console.log('User authenticated, rendering dashboard');
      setShouldRender(true);
    }
  }, [isAuthenticated, loading, user, router]);

  console.log('Dashboard render - loading:', loading, 'shouldRender:', shouldRender, 'user:', user);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!shouldRender || !user) {
    return null;
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format organization type
  const formatOrgType = (type) => {
    if (!type) return 'Not set';
    return type.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleFeatureClick = (feature) => {
    if (feature === 'Courtroom Simulator') {
      router.push('/courtroom');
    } else if (feature === 'Ask the Law') {
      router.push('/assistant');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Background Decoration */}
      <div className="bg-decoration">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* Blue Circle Toggle Button */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        <User size={20} />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Close Button */}
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Sidebar"
        >
          <X size={24} />
        </button>

        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Image
              src="/logo.png"
              alt="KAANOONGPT"
              width={50}
              height={50}
              className="sidebar-logo-img"
            />
            <span className="sidebar-logo-text">KAANOONGPT</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="sidebar-nav">
          <button className="sidebar-nav-item active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button className="sidebar-nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>

        {/* Profile Section */}
        <div className="sidebar-profile-section">
          <div className="sidebar-user-profile">
            <div className="user-avatar-small">
              {getInitials(user.full_name || user.email)}
            </div>
            <div className="user-info-compact">
              <h3 className="user-name-compact">{user.full_name || 'User'}</h3>
              <p className="user-email-compact">{user.email}</p>
            </div>
          </div>

          <button onClick={logout} className="sidebar-logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Divider */}
        <div className="sidebar-divider"></div>

        {/* Account Information Header */}
        <div className="sidebar-content-header">
          <h4 className="sidebar-section-title">Account Information</h4>
        </div>

        {/* User Details */}
        <div className="sidebar-content">
          <div className="user-info-cards">
            <div className="info-card">
              <div className="info-card-header">
                <Mail size={16} className="info-icon" />
                <span className="info-label">EMAIL</span>
              </div>
              <p className="info-value">{user.email}</p>
            </div>

            <div className="info-card">
              <div className="info-card-header">
                <Building2 size={16} className="info-icon" />
                <span className="info-label">ORGANIZATION</span>
              </div>
              <p className="info-value">{user.organization_name || 'Not set'}</p>
              <p className="info-subvalue">{formatOrgType(user.organization_type)}</p>
            </div>

            {user.date_of_birth && (
              <div className="info-card">
                <div className="info-card-header">
                  <Calendar size={16} className="info-icon" />
                  <span className="info-label">DATE OF BIRTH</span>
                </div>
                <p className="info-value">
                  {new Date(user.date_of_birth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main-content">
        {/* Top Navigation Bar */}
        <nav className="dashboard-nav">
          <div className="nav-left">
            <div className="nav-logo">
              <Image
                src="/logo.png"
                alt="KAANOONGPT"
                width={40}
                height={40}
                className="nav-logo-img"
              />
              <span className="logo-text">KAANOONGPT</span>
            </div>
          </div>

          <div className="nav-center">
            <a href="/" className="nav-link">Home</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#why-choose" className="nav-link">Why KaanoonGPT</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#" className="nav-link">Cases</a>
            <a href="#" className="nav-link">Research</a>
            <a href="#contact" className="nav-link">Contact Us</a>
          </div>

          <div className="nav-right">
            <button className="nav-search-btn" title="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
            <button className="nav-notification-btn" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge">1</span>
            </button>
            <button className="nav-user-btn" onClick={() => setSidebarOpen(true)}>
              <div className="nav-user-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
                </svg>
              </div>
              <span className="nav-user-name">{user.full_name?.split(' ')[0] || 'User'}</span>
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-left">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
              </svg>
              <span>AI-Powered Legal Platform</span>
            </div>
            <h1 className="hero-title">Welcome back, <span className="hero-name">{user.full_name?.split(' ')[0] || 'User'}</span></h1>
            <p className="hero-description">
              Your comprehensive AI legal companion. Research law, analyze cases, generate documents, and predict outcomes with advanced artificial intelligence.
            </p>
            <div className="hero-buttons">
              <button className="hero-btn hero-btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Start Consultation
              </button>
              <button className="hero-btn hero-btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Upload Document
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="stats-card">
              <div className="stat-item">
                <div className="stat-icon stat-icon-orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.96-3.83c-.3-.39-.97-.39-1.25 0-.31.4-.31 1.02 0 1.41l3.54 4.35c.3.39.9.39 1.2 0l3.79-4.87c.31-.39.31-1.02 0-1.41-.29-.38-.95-.39-1.25-.01z"></path>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Active Cases</div>
                  <div className="stat-value">12</div>
                  <div className="stat-meta">ongoing matters</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon stat-icon-green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Success Rate</div>
                  <div className="stat-value">87%</div>
                  <div className="stat-meta">win rate</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon stat-icon-blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">AI Predictions</div>
                  <div className="stat-value">94%</div>
                  <div className="stat-meta">accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Services Grid */}
        <div className="services-container" id="services">
          <h2 className="services-heading">Services</h2>
          <div className="services-grid">
            {/* Courtroom Simulator Card */}
            <div className="service-card" onClick={() => handleFeatureClick('Courtroom Simulator')}>
              <div className="service-card-header">
                <div className="service-icon service-icon-amber">
                  <Gavel size={32} />
                </div>
                <h3 className="service-title">Courtroom Simulator</h3>
              </div>
              <p className="service-description">
                Watch AI lawyers debate your case and the judge deliver a verdict — just like a real courtroom
              </p>
              <button className="service-btn service-btn-amber">
                Start Battle →
              </button>
            </div>

            {/* Ask the Law Card */}
            <div className="service-card" onClick={() => handleFeatureClick('Ask the Law')}>
              <div className="service-card-header">
                <div className="service-icon service-icon-blue">
                  <MessageSquare size={32} />
                </div>
                <h3 className="service-title">Ask the Law</h3>
              </div>
              <p className="service-description">
                Chat with AI to get clear answers on Nepali laws in English or Nepali - anytime, anywhere
              </p>
              <button className="service-btn service-btn-blue">
                Ask Now →
              </button>
            </div>

            {/* Case Predictor Card */}
            <div className="service-card service-card-disabled">
              <div className="service-card-header">
                <div className="service-icon service-icon-green">
                  <BarChart3 size={32} />
                </div>
                <h3 className="service-title">Case Predictor</h3>
              </div>
              <p className="service-description">
                Upload case details and discover the probability of winning, backed by past precedents.
              </p>
              <button className="service-btn service-btn-disabled" disabled>
                Coming Soon →
              </button>
            </div>

            {/* Legal Case Search Card */}
            <div className="service-card service-card-disabled">
              <div className="service-card-header">
                <div className="service-icon service-icon-gray">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <h3 className="service-title">Legal Case Search</h3>
              </div>
              <p className="service-description">
                Search and analyze legal cases with our advanced search engine and chatbot
              </p>
              <button className="service-btn service-btn-disabled" disabled>
                Coming Soon →
              </button>
            </div>

            {/* Kanoon Analyze Card */}
            <div className="service-card service-card-disabled">
              <div className="service-card-header">
                <div className="service-icon service-icon-gray">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                </div>
                <h3 className="service-title">Kanoon Analyze</h3>
              </div>
              <p className="service-description">
                Analyze legal documents with AI-powered insights and recommendations
              </p>
              <button className="service-btn service-btn-disabled" disabled>
                Coming Soon →
              </button>
            </div>

            {/* Drafting Assistant Card */}
            <div className="service-card service-card-disabled">
              <div className="service-card-header">
                <div className="service-icon service-icon-gray">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <h3 className="service-title">Drafting Assistant</h3>
              </div>
              <p className="service-description">
                Generate legal documents and contracts with AI assistance
              </p>
              <button className="service-btn service-btn-disabled" disabled>
                Coming Soon →
              </button>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="why-choose-section" id="why-choose">
          <div className="why-choose-badge">Why Choose Us</div>
          <h2 className="why-choose-title">Built for Legal Excellence</h2>
          <p className="why-choose-subtitle">Combining decades of legal expertise with cutting-edge AI technology</p>

          <div className="why-choose-grid">
            <div className="why-choose-card">
              <div className="why-choose-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="why-choose-card-title">Secure & Confidential</h3>
              <p className="why-choose-card-desc">Bank-grade encryption ensures your legal data remains private and protected.</p>
            </div>

            <div className="why-choose-card">
              <div className="why-choose-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <h3 className="why-choose-card-title">Lightning Fast</h3>
              <p className="why-choose-card-desc">Get instant results powered by advanced AI algorithms and cloud computing.</p>
            </div>

            <div className="why-choose-card">
              <div className="why-choose-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <path d="M12 1v6m0 6v6"></path>
                  <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"></path>
                  <path d="M1 12h6m6 0h6"></path>
                  <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
                </svg>
              </div>
              <h3 className="why-choose-card-title">Highly Accurate</h3>
              <p className="why-choose-card-desc">97% prediction accuracy backed by millions of legal precedents and cases.</p>
            </div>

            <div className="why-choose-card">
              <div className="why-choose-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6-6 6 6"></path>
                  <path d="M6 15l6 6 6-6"></path>
                </svg>
              </div>
              <h3 className="why-choose-card-title">Award Winning</h3>
              <p className="why-choose-card-desc">Recognized by leading legal technology associations and industry experts.</p>
            </div>
          </div>
        </div>

        {/* About KaanoonGPT Section */}
        <div className="about-section" id="about">
          <div className="about-container">
            <div className="about-left">
              <div className="about-badge">About KaanoonGPT</div>
              <h2 className="about-title">Transforming Legal Practice with AI</h2>
              <p className="about-description">
                KaanoonGPT is Nepal's leading AI-powered legal platform, designed to revolutionize how law firms and legal professionals work. We combine cutting-edge artificial intelligence with deep legal expertise to provide unparalleled support for legal research, case analysis, and document management.
              </p>
              <p className="about-description">
                Founded by legal technology experts and AI specialists, our mission is to make legal services more accessible, efficient, and intelligent. We serve law firms, corporate legal departments, and individual practitioners across Nepal and beyond.
              </p>

              <div className="about-stats">
                <div className="about-stat">
                  <div className="about-stat-value">5000+</div>
                  <div className="about-stat-label">Cases Analyzed</div>
                </div>
                <div className="about-stat">
                  <div className="about-stat-value">150+</div>
                  <div className="about-stat-label">Law Firms</div>
                </div>
                <div className="about-stat">
                  <div className="about-stat-value">87%</div>
                  <div className="about-stat-label">Accuracy Rate</div>
                </div>
                <div className="about-stat">
                  <div className="about-stat-value">24/7</div>
                  <div className="about-stat-label">Support</div>
                </div>
              </div>

              <button className="about-btn">
                Learn More About Us
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>

            <div className="about-right">
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                  </svg>
                </div>
                <h3 className="about-feature-title">Advanced AI Technology</h3>
                <p className="about-feature-desc">Our proprietary AI models are trained on millions of legal documents and case precedents.</p>
              </div>

              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="about-feature-title">Proven Track Record</h3>
                <p className="about-feature-desc">Trusted by top law firms in Nepal with a consistent 87% prediction accuracy rate.</p>
              </div>

              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="about-feature-title">Expert Support Team</h3>
                <p className="about-feature-desc">Our team of legal experts and AI specialists are here to help you succeed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2 className="cta-title">Ready to Transform Your Legal Practice?</h2>
          <p className="cta-subtitle">Join hundreds of law firms already using KaanoonGPT to work smarter and faster.</p>
          <div className="cta-buttons">
            <button className="cta-btn cta-btn-primary">
              Get Started Free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
            <input type="email" placeholder="Enter your email" className="cta-email-input" />
          </div>
        </div>

        {/* Footer */}
        <footer className="dashboard-footer" id="contact">
          <div className="footer-container">
            <div className="footer-column">
              <div className="footer-logo">
                <Image
                  src="/logo.png"
                  alt="KAANOONGPT"
                  width={40}
                  height={40}
                  className="footer-logo-img"
                />
                <div>
                  <div className="footer-logo-text">KAANOONGPT</div>
                  <div className="footer-logo-subtitle">Legal Intelligence Platform</div>
                </div>
              </div>
              <p className="footer-description">AI-powered legal platform for modern law firms and practitioners.</p>
              <div className="footer-socials">
                <a href="#" className="footer-social-link" title="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
                <a href="#" className="footer-social-link" title="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s-1.1 2-3 4.2"></path>
                  </svg>
                </a>
                <a href="#" className="footer-social-link" title="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a1 1 0 011-1h3z"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Services</h4>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">Ask the Law</a></li>
                <li><a href="#" className="footer-link">Courtroom Simulator</a></li>
                <li><a href="#" className="footer-link">Case Predictor</a></li>
                <li><a href="#" className="footer-link">Document Analyzer</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">About Us</a></li>
                <li><a href="#" className="footer-link">Careers</a></li>
                <li><a href="#" className="footer-link">Blog</a></li>
                <li><a href="#" className="footer-link">Contact</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Contact</h4>
              <div className="footer-contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a href="mailto:info@kaanoongpt.com" className="footer-link">info@kaanoongpt.com</a>
              </div>
              <div className="footer-contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href="tel:+977-1-XXXXXXX" className="footer-link">+977-1-XXXXXXX</a>
              </div>
              <div className="footer-contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="footer-link">Kathmandu, Nepal</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">© 2024 KaanoonGPT. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">Privacy Policy</a>
              <a href="#" className="footer-bottom-link">Terms of Service</a>
              <a href="#" className="footer-bottom-link">Cookie Policy</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}