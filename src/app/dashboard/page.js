'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, Gavel, MessageSquare, Coins, FileText, Menu, X,
  Home, Settings, Users, FolderOpen, Calendar, HelpCircle, Sun, Moon
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '../context/ThemeContext';
import './dashboard.css';

export default function Dashboard() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const [enabledFeatures, setEnabledFeatures] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
    setShouldRender(true);
  }, [isAuthenticated, loading, user, router]);

  // Fetch enabled features
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetch(`${API_URL}/api/courtroom/setup/enabled-features`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setEnabledFeatures(d.enabled_features || []))
      .catch(() => setEnabledFeatures(['courtroom_simulator', 'ask_the_law', 'case_predictor', 'petition_maker']));
  }, [isAuthenticated]);

  // Fetch token balance
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetch(`${API_URL}/api/kanoongpt/tokens/balance`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBalance(d.balance))
      .catch(() => {});
  }, [isAuthenticated]);

  const isEnabled = (key) => enabledFeatures === null || enabledFeatures.includes(key);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return <div className="dash-loading"><div className="dash-loading-text">Loading...</div></div>;
  if (!shouldRender || !user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'User';

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', active: true },
    { icon: FolderOpen, label: 'My Cases', path: '/cases', badge: '3' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  return (
    <div className="dash">
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}
      {profileOpen && <div className="dash-overlay" onClick={() => setProfileOpen(false)} />}

      {/* Left Sidebar Navigation */}
      <aside className={`dash-nav-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-nav-header">
          <Image src="/logo.png" alt="KaanoonGPT" width={32} height={32} />
          <span className="dash-nav-logo-text">KAANOONGPT</span>
          <button className="dash-nav-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="dash-nav-menu">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={`dash-nav-item ${item.active ? 'active' : ''}`}
              onClick={() => {
                if (item.path) router.push(item.path);
                setSidebarOpen(false);
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge && <span className="dash-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="dash-nav-footer">
          <button className="dash-nav-logout" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Profile Sidebar */}
      <aside className={`dash-profile-sidebar ${profileOpen ? 'open' : ''}`}>
        <button className="dash-sidebar-close" onClick={() => setProfileOpen(false)}>
          <X size={20} />
        </button>
        <div className="dash-sidebar-profile">
          <div className="dash-sidebar-avatar">{getInitials(user.full_name)}</div>
          <h3>{user.full_name || 'User'}</h3>
          <p>{user.email}</p>
        </div>
        <div className="dash-sidebar-info">
          <div className="dash-info-row">
            <span className="dash-info-label">Organization</span>
            <span className="dash-info-value">{user.organization_name || 'Not set'}</span>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">Country</span>
            <span className="dash-info-value">{user.country || 'Not set'}</span>
          </div>
          {balance !== null && (
            <div className="dash-info-row">
              <span className="dash-info-label">Credits</span>
              <span className="dash-info-value dash-info-credits">{balance}</span>
            </div>
          )}
        </div>
        <div className="dash-sidebar-actions">
          <button className="dash-sidebar-btn" onClick={() => router.push('/pricing')}>
            <Coins size={16} /> Buy Credits
          </button>
          <button className="dash-sidebar-btn dash-logout-btn" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dash-content-wrapper">
        {/* Top Bar */}
        <nav className="dash-topbar">
          <div className="dash-topbar-left">
            <button className="dash-hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="dash-page-title">Dashboard</h2>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {balance !== null && (
              <button className="dash-token-badge" onClick={() => router.push('/pricing')}>
                <Coins size={16} />
                <span>{balance} credits</span>
              </button>
            )}
            <button className="dash-avatar-btn" onClick={() => setProfileOpen(true)}>
              <div className="dash-avatar">{getInitials(user.full_name)}</div>
              <span className="dash-avatar-name">{firstName}</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="dash-main">
          {/* Welcome */}
          <div className="dash-welcome">
            <h1>Welcome back, <span className="dash-name">{firstName}</span></h1>
            <p>What would you like to do today?</p>
          </div>

          {/* Services Grid */}
          <div className="dash-services">
            {isEnabled('ask_the_law') && (
              <div className="dash-card" onClick={() => router.push('/assistant')}>
                <div className="dash-card-icon dash-icon-blue">
                  <MessageSquare size={28} />
                </div>
                <h3>Ask the Law</h3>
                <p>Chat with AI to get answers on Nepali laws with citations</p>
                <span className="dash-card-action">Ask Now →</span>
              </div>
            )}

            {isEnabled('courtroom_simulator') && (
              <div className="dash-card" onClick={() => router.push('/courtroom')}>
                <div className="dash-card-icon dash-icon-amber">
                  <Gavel size={28} />
                </div>
                <h3>Courtroom Simulator</h3>
                <p>Watch AI lawyers debate your case and the judge deliver a verdict</p>
                <span className="dash-card-action">Start Trial →</span>
              </div>
            )}

            {isEnabled('petition_maker') && (
              <div className="dash-card" onClick={() => router.push('/petition-maker')}>
                <div className="dash-card-icon dash-icon-purple">
                  <FileText size={28} />
                </div>
                <h3>Petition Maker</h3>
                <p className="dash-card-nepali">फिरादपत्र</p>
                <p>Generate court-ready firad patra for civil cases in minutes</p>
                <span className="dash-card-action">Generate Petition →</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {balance !== null && (
            <div className="dash-credits-bar">
              <div className="dash-credits-info">
                <Coins size={18} />
                <span>You have <strong>{balance}</strong> credits remaining</span>
              </div>
              <button className="dash-credits-buy" onClick={() => router.push('/pricing')}>
                Buy More Credits
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
