'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LogOut, Gavel, MessageSquare, BarChart3, Mail, Calendar, Building2, User, X, LayoutDashboard, Settings } from 'lucide-react';
import Image from 'next/image';
import './dashboard.css';
import { apiRequest, API_URL } from '../lib/api';
export default function Dashboard() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
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
    console.log(`${feature} clicked`);
    // Add your navigation logic here
  };

  return (
    <div className="dashboard-container">
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
              src="/logo.jpeg" 
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
          <div className="nav-logo">
            <Image 
              src="/logo.jpeg" 
              alt="KAANOONGPT" 
              width={40} 
              height={40} 
              className="nav-logo-img"
            />
            <span className="logo-text">KAANOONGPT</span>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-icon-wrapper">
            <Image 
              src="/logo.jpeg" 
              alt="KAANOONGPT" 
              width={64} 
              height={64} 
              className="hero-logo"
            />
          </div>

          <h1 className="hero-title">Welcome to Kaanoongpt</h1>

          <p className="hero-subtitle">
            Your AI Legal Companion — Ask Law, Watch Lawyers Argue, See the Verdict.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="features-grid">
          {/* Courtroom Simulator Card */}
          <div className="feature-card" onClick={() => handleFeatureClick('Courtroom Simulator')}>
            <Gavel size={48} className="feature-icon" />
            
            <div className="feature-content">
              <h3 className="feature-title">Courtroom Simulator</h3>
              <p className="feature-description">
                Watch AI lawyers debate your case and the judge deliver a verdict — just like a real courtroom
              </p>
            </div>

            <button className="feature-btn">
              Agent Battle Mode →
            </button>
          </div>

          {/* Ask the Law Card */}
          <div className="feature-card" onClick={() => handleFeatureClick('Ask the Law')}>
            <MessageSquare size={48} className="feature-icon" />
            
            <div className="feature-content">
              <h3 className="feature-title">Ask the Law</h3>
              <p className="feature-description">
                Chat with AI to get clear answers on Nepali laws in English or Nepali - anytime, anywhere
              </p>
            </div>

            <button className="feature-btn">
              Q&A Bot →
            </button>
          </div>

          {/* Case Predictor Card */}
          <div className="feature-card feature-card-disabled">
            <BarChart3 size={48} className="feature-icon" />
            
            <div className="feature-content">
              <h3 className="feature-title">Case Predictor</h3>
              <p className="feature-description">
                Upload case details and discover the probability of winning, backed by past precedents.
              </p>
            </div>

            <button className="feature-btn feature-btn-disabled" disabled>
              Coming Soon →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}