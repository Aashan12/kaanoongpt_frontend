'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { PanelLeftClose, MessageSquare, Scale, FileText, User, Menu, Home } from 'lucide-react';
import AppSidebar from '../components/AppSidebar';
import DashboardView from '../components/views/DashboardView';
import AssistantView from '../components/views/AssistantView';
import CourtroomView from '../components/views/CourtroomView';
import PetitionView from '../components/views/PetitionView';
import './assistant.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

export default function Assistant() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  
  // View state management
  const [activeView, setActiveView] = useState('assistant');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Open by default on desktop
  const [theme, setTheme] = useState('dark');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Chat history state
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ka-theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  // Force theme application to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pageElement = document.querySelector('.ka-page');
      if (pageElement) {
        pageElement.classList.remove('light', 'dark');
        pageElement.classList.add(theme);
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ka-theme', next);
      return next;
    });
  };

  const setSpecificTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('ka-theme', newTheme);
  };

  // Load conversation list from server
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE_URL}/api/conversations`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChatHistory(data.map(c => ({ id: c.id, title: c.title, date: c.updated_at })));
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="ka-loading">
        <div className="ka-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) return null;

  // View switching handler
  const handleViewSwitch = (viewName) => {
    try {
      // Validate view name
      if (!['dashboard', 'assistant', 'courtroom', 'petition'].includes(viewName)) {
        console.error('Invalid view name:', viewName);
        return;
      }
      setActiveView(viewName);
      // Close sidebar on mobile only after navigation
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('View switch failed:', error);
      setActiveView('assistant');
    }
  };

  // Handle logout - show confirmation modal
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Confirm logout - actually perform logout
  const confirmLogout = () => {
    localStorage.removeItem('access_token');
    setShowLogoutModal(false);
    router.push('/');
    // Force a clean navigation
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Handle new chat
  const handleNewChat = () => {
    setCurrentChatId(null);
    setActiveView('assistant');
  };

  // Handle select chat from history
  const handleSelectChat = (id) => {
    setCurrentChatId(id);
    setActiveView('assistant');
  };

  // Handle delete chat
  const handleDeleteChat = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/conversations/${id}`, { 
        method: 'DELETE', 
        headers: authHeaders() 
      });
    } catch {}
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  };

  // Handle chat ID change from AssistantView
  const handleChatIdChange = (id) => {
    setCurrentChatId(id);
    // Refresh chat history
    fetch(`${API_BASE_URL}/api/conversations`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChatHistory(data.map(c => ({ id: c.id, title: c.title, date: c.updated_at })));
        }
      })
      .catch(() => {});
  };

  return (
    <div className={`ka-page ${theme} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Activity Bar - shows when sidebar is closed */}
      <div className="ka-activity-bar">
        <button 
          className="ka-activity-btn" 
          onClick={() => setSidebarOpen(true)} 
          aria-label="Expand sidebar" 
          title="Expand sidebar"
        >
          <PanelLeftClose size={20} style={{ transform: 'scaleX(-1)' }} />
        </button>
        <div className="ka-activity-divider" />
        <button 
          className={`ka-activity-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleViewSwitch('dashboard')} 
          aria-label="Dashboard" 
          title="Dashboard"
        >
          <Home size={20} />
        </button>
        <button 
          className={`ka-activity-btn ${activeView === 'assistant' ? 'active' : ''}`}
          onClick={() => handleViewSwitch('assistant')} 
          aria-label="Assistant" 
          title="Assistant"
        >
          <MessageSquare size={20} />
        </button>
        <button 
          className={`ka-activity-btn ${activeView === 'courtroom' ? 'active' : ''}`}
          onClick={() => handleViewSwitch('courtroom')} 
          aria-label="Courtroom Simulator" 
          title="Courtroom Simulator"
        >
          <Scale size={20} />
        </button>
        <button 
          className={`ka-activity-btn ${activeView === 'petition' ? 'active' : ''}`}
          onClick={() => handleViewSwitch('petition')} 
          aria-label="Petition Maker" 
          title="Petition Maker"
        >
          <FileText size={20} />
        </button>
        <div style={{ flex: 1 }} />
        <button 
          className="ka-activity-btn"
          onClick={() => handleViewSwitch('dashboard')} 
          aria-label="Profile" 
          title="Profile"
        >
          <User size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <AppSidebar
        activeView={activeView}
        onViewSwitch={handleViewSwitch}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        theme={theme}
        onThemeToggle={toggleTheme}
        onSetTheme={setSpecificTheme}
        onLogout={handleLogout}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
      />

      {/* Main Content Area */}
      <div className="ka-main">
        {/* Overlay for mobile only */}
        {sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768 && (
          <div className="ka-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        
        {/* Mobile menu button */}
        <button 
          className="ka-mobile-menu-btn" 
          onClick={() => setSidebarOpen(true)} 
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Conditional View Rendering */}
        {activeView === 'dashboard' && (
          <DashboardView 
            user={user} 
            theme={theme} 
            onNavigate={handleViewSwitch} 
          />
        )}

        {activeView === 'assistant' && (
          <AssistantView 
            user={user} 
            theme={theme} 
            currentChatId={currentChatId}
            onChatIdChange={handleChatIdChange}
          />
        )}

        {activeView === 'courtroom' && (
          <CourtroomView 
            user={user} 
            theme={theme} 
          />
        )}

        {activeView === 'petition' && (
          <PetitionView 
            user={user} 
            theme={theme} 
          />
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="ka-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="ka-logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="ka-logout-modal-actions">
              <button 
                className="ka-logout-cancel" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="ka-logout-confirm" 
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
