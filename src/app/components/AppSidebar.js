'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Clock, Home, FileText, Scale, MessageSquare,
  ChevronUp, ChevronDown, Settings, CreditCard, LogOut, PanelLeftClose,
  User, Moon, Sun, ChevronRight
} from 'lucide-react';
import './AppSidebar.css';

export default function AppSidebar({
  activeView,
  onViewSwitch,
  sidebarOpen,
  onToggle,
  user,
  theme,
  onThemeToggle,
  onSetTheme,
  onLogout,
  chatHistory,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
}) {
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const [showAppearanceSubmenu, setShowAppearanceSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const profileMenuRef = useRef(null);
  const appearanceItemRef = useRef(null);
  const submenuCloseTimer = useRef(null);

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
        setShowAppearanceSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileMenuOpen]);

  // Calculate submenu position when hovering
  const handleAppearanceHover = () => {
    if (submenuCloseTimer.current) {
      clearTimeout(submenuCloseTimer.current);
      submenuCloseTimer.current = null;
    }
    if (appearanceItemRef.current) {
      const rect = appearanceItemRef.current.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 8
      });
      setShowAppearanceSubmenu(true);
    }
  };

  const handleAppearanceLeave = () => {
    // Longer delay to ensure clicks can register
    submenuCloseTimer.current = setTimeout(() => {
      setShowAppearanceSubmenu(false);
    }, 300);
  };

  const handleSubmenuEnter = () => {
    if (submenuCloseTimer.current) {
      clearTimeout(submenuCloseTimer.current);
      submenuCloseTimer.current = null;
    }
  };

  const handleSubmenuLeave = () => {
    setShowAppearanceSubmenu(false);
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // Get user display name
  const getUserName = () => {
    if (user?.full_name && user.full_name !== 'User') {
      const firstName = user.full_name.split(' ')[0];
      return firstName.toUpperCase();
    }
    if (user?.email) {
      return user.email.split('@')[0].toUpperCase();
    }
    return 'User';
  };

  // Get user plan
  const getUserPlan = () => {
    if (user?.plan) {
      return user.plan;
    }
    return 'Free plan';
  };

  // Check if a view is active
  const isActive = (viewName) => activeView === viewName;

  return (
    <aside className={`ka-sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="ka-sidebar-top">
        <div className="ka-sidebar-brand">
          <img src="/logo.png" alt="KaanoonGPT" style={{width: 28, height: 28, borderRadius: 6}} />
          <span>KAANOONGPT</span>
        </div>
        <button 
          className="ka-sidebar-toggle" 
          onClick={onToggle} 
          aria-label="Close sidebar" 
          title="Close sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <button className="ka-new-chat" onClick={onNewChat}>
        <Plus size={16} />
        <span>New Chat</span>
      </button>

      <div className="ka-feature-links">
        <button 
          className={`ka-feature-link ${isActive('dashboard') ? 'active' : ''}`}
          onClick={() => {
            onViewSwitch('dashboard');
            if (sidebarOpen) onToggle();
          }}
        >
          <Home size={16} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`ka-feature-link ${isActive('assistant') ? 'active' : ''}`}
          onClick={() => onViewSwitch('assistant')}
        >
          <MessageSquare size={16} />
          <span>Assistant</span>
        </button>
        <button 
          className={`ka-feature-link ${isActive('courtroom') ? 'active' : ''}`}
          onClick={() => {
            onViewSwitch('courtroom');
            if (sidebarOpen) onToggle();
          }}
        >
          <Scale size={16} />
          <span>Courtroom Simulator</span>
        </button>
        <button 
          className={`ka-feature-link ${isActive('petition') ? 'active' : ''}`}
          onClick={() => onViewSwitch('petition')}
        >
          <FileText size={16} />
          <span>Petition Maker</span>
        </button>
      </div>

      <div className="ka-section-header">
        <span>History</span>
        <button 
          className="ka-history-toggle" 
          onClick={() => setHistoryExpanded(!historyExpanded)}
          aria-label={historyExpanded ? "Hide history" : "Show history"}
        >
          {historyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {historyExpanded && (
        <div className="ka-history">
          {chatHistory.length > 0 ? (
            <>
              {chatHistory.slice(0, showAllHistory ? chatHistory.length : 9).map(chat => (
                <div key={chat.id} className={`ka-history-item ${currentChatId === chat.id ? 'active' : ''}`}>
                  <button 
                    className="ka-history-link" 
                    onClick={() => onSelectChat(chat.id)} 
                    title={chat.title}
                  >
                    <span>{chat.title}</span>
                  </button>
                  <button 
                    className="ka-history-del" 
                    onClick={() => onDeleteChat(chat.id)} 
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {chatHistory.length > 9 && !showAllHistory && (
                <button 
                  className="ka-show-more" 
                  onClick={() => setShowAllHistory(true)}
                >
                  Show More
                </button>
              )}
              {showAllHistory && chatHistory.length > 9 && (
                <button 
                  className="ka-show-more" 
                  onClick={() => setShowAllHistory(false)}
                >
                  Show Less
                </button>
              )}
            </>
          ) : (
            <div className="ka-history-empty">
              <Clock size={20} />
              <p>No conversations yet</p>
            </div>
          )}
        </div>
      )}

      <div className="ka-sidebar-footer">
        <div className="ka-profile-section" ref={profileMenuRef}>
          <button 
            className="ka-profile-trigger" 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <div className="ka-profile-avatar">
              {getUserInitials()}
            </div>
            <div className="ka-profile-info">
              <div className="ka-profile-name">{getUserName()}</div>
              <div className="ka-profile-plan">{getUserPlan()}</div>
            </div>
            <ChevronUp size={16} className={`ka-profile-chevron ${profileMenuOpen ? 'open' : ''}`} />
          </button>
          {profileMenuOpen && (
            <div className="ka-profile-menu">
              <button 
                className="ka-profile-menu-item" 
                onClick={() => { 
                  onViewSwitch('dashboard'); 
                  setProfileMenuOpen(false); 
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              
              <div 
                ref={appearanceItemRef}
                className="ka-profile-menu-item ka-appearance-item"
                onMouseEnter={handleAppearanceHover}
                onMouseLeave={handleAppearanceLeave}
              >
                <Moon size={16} />
                <span>Appearance</span>
                <ChevronRight size={14} className="ka-submenu-arrow" />
              </div>

              <button 
                className="ka-profile-menu-item" 
                onClick={() => { 
                  router.push('/pricing');
                  setProfileMenuOpen(false); 
                }}
              >
                <CreditCard size={16} />
                <span>Upgrade Plan</span>
              </button>
              <div className="ka-profile-menu-divider" />
              <button className="ka-profile-menu-item ka-logout" onClick={onLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render submenu as portal to escape sidebar overflow */}
      {showAppearanceSubmenu && typeof window !== 'undefined' && createPortal(
        <div 
          className={`ka-appearance-submenu ${theme}`}
          style={{
            top: `${submenuPosition.top}px`,
            left: `${submenuPosition.left}px`
          }}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className={`ka-appearance-option ${theme === 'light' ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (submenuCloseTimer.current) {
                clearTimeout(submenuCloseTimer.current);
                submenuCloseTimer.current = null;
              }
              onSetTheme('light');
              setProfileMenuOpen(false);
              setShowAppearanceSubmenu(false);
            }}
          >
            <Sun size={16} />
            <span>Light</span>
            {theme === 'light' && <span className="ka-check-mark">✓</span>}
          </button>
          <button 
            className={`ka-appearance-option ${theme === 'dark' ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (submenuCloseTimer.current) {
                clearTimeout(submenuCloseTimer.current);
                submenuCloseTimer.current = null;
              }
              onSetTheme('dark');
              setProfileMenuOpen(false);
              setShowAppearanceSubmenu(false);
            }}
          >
            <Moon size={16} />
            <span>Dark</span>
            {theme === 'dark' && <span className="ka-check-mark">✓</span>}
          </button>
        </div>,
        document.body
      )}
    </aside>
  );
}
