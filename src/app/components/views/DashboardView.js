'use client';

import { useEffect, useState } from 'react';
import { Gavel, MessageSquare, Coins, FileText } from 'lucide-react';
import './DashboardView.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DashboardView({ user, theme, onNavigate }) {
  const [balance, setBalance] = useState(null);
  const [enabledFeatures, setEnabledFeatures] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // Fetch enabled features
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/courtroom/setup/enabled-features`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setEnabledFeatures(d.enabled_features || []))
      .catch(() => setEnabledFeatures(['courtroom_simulator', 'ask_the_law', 'case_predictor', 'petition_maker']));
  }, [token]);

  // Fetch token balance
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/kanoongpt/tokens/balance`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBalance(d.balance))
      .catch(() => {});
  }, [token]);

  const isEnabled = (key) => enabledFeatures === null || enabledFeatures.includes(key);

  const firstName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="dashboard-view">
      {/* Welcome */}
      <div className="dash-welcome">
        <h1>Welcome back, <span className="dash-name">{firstName}</span></h1>
        <p>What would you like to do today?</p>
      </div>

      {/* Services Grid */}
      <div className="dash-services">
        {isEnabled('ask_the_law') && (
          <div className="dash-card" onClick={() => onNavigate('assistant')}>
            <div className="dash-card-icon dash-icon-blue">
              <MessageSquare size={28} />
            </div>
            <h3>Ask the Law</h3>
            <p>Chat with AI to get answers on Nepali laws with citations</p>
            <span className="dash-card-action">Ask Now →</span>
          </div>
        )}

        {isEnabled('courtroom_simulator') && (
          <div className="dash-card" onClick={() => onNavigate('courtroom')}>
            <div className="dash-card-icon dash-icon-amber">
              <Gavel size={28} />
            </div>
            <h3>Courtroom Simulator</h3>
            <p>Watch AI lawyers debate your case and the judge deliver a verdict</p>
            <span className="dash-card-action">Start Trial →</span>
          </div>
        )}

        {isEnabled('petition_maker') && (
          <div className="dash-card" onClick={() => onNavigate('petition')}>
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
          <button className="dash-credits-buy" onClick={() => onNavigate('pricing')}>
            Buy More Credits
          </button>
        </div>
      )}
    </div>
  );
}
