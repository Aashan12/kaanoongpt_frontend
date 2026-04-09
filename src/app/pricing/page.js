'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { API_URL } from '../lib/api';
import './pricing.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    priceUsd: '',
    period: '/month',
    description: 'Perfect for getting started',
    credits: 50,
    features: [
      '50 credits on signup',
      'Basic Ask the Law',
      '1 Courtroom Simulation',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
    isPaid: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹299',
    priceUsd: '$2.99',
    period: '',
    description: 'For serious legal needs',
    credits: 1000,
    features: [
      '1,000 credits',
      'Unlimited Ask the Law',
      'Unlimited Simulations',
      'Priority support',
    ],
    cta: 'Buy Pro',
    popular: true,
    isPaid: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹999',
    priceUsd: '$9.99',
    period: '',
    description: 'For organizations & firms',
    credits: 2000,
    features: [
      '2,000 credits',
      'Everything in Pro',
      'Team accounts',
      'Dedicated support',
    ],
    cta: 'Buy Enterprise',
    popular: false,
    isPaid: true,
  },
];

export default function PricingPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [balance, setBalance] = useState(null);
  const [totalPurchased, setTotalPurchased] = useState(0);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated && token) { fetchBalance(); fetchPacks(); }
  }, [isAuthenticated, authLoading]);

  async function fetchBalance() {
    try {
      const res = await fetch(`${API_URL}/api/kanoongpt/tokens/balance`, { headers: authHeaders });
      if (res.ok) { const d = await res.json(); setBalance(d.balance); setTotalPurchased(d.total_purchased || 0); }
    } catch (e) { console.error(e); }
  }

  async function fetchPacks() {
    try {
      const res = await fetch(`${API_URL}/api/kanoongpt/tokens/packs`, { headers: authHeaders });
      if (res.ok) { const d = await res.json(); setStripeAvailable(d.stripe_available || false); }
    } catch (e) { console.error(e); }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${API_URL}/api/kanoongpt/tokens/history?limit=20`, { headers: authHeaders });
      if (res.ok) { const d = await res.json(); setHistory(d.transactions); setShowHistory(true); }
    } catch (e) { console.error(e); }
  }

  async function handleEsewa(packId) {
    setLoadingAction(`esewa-${packId}`); setError('');
    try {
      const res = await fetch(`${API_URL}/api/kanoongpt/payments/initiate`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          pack_id: packId,
          success_url: `${window.location.origin}/pricing/success`,
          failure_url: `${window.location.origin}/pricing/failure`,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const data = await res.json();
      localStorage.setItem('esewa_tx_uuid', data.transaction_uuid);
      localStorage.setItem('payment_provider', 'esewa');
      const form = document.createElement('form');
      form.method = 'POST'; form.action = data.payment_url;
      Object.entries(data.params).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = k; input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form); form.submit();
    } catch (e) { setError(e.message); setLoadingAction(null); }
  }

  async function handleStripe(packId) {
    setLoadingAction(`stripe-${packId}`); setError('');
    try {
      const res = await fetch(`${API_URL}/api/kanoongpt/payments/stripe/initiate`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          pack_id: packId,
          success_url: `${window.location.origin}/pricing/success?provider=stripe`,
          cancel_url: `${window.location.origin}/pricing/failure`,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const data = await res.json();
      localStorage.setItem('stripe_session_id', data.session_id);
      localStorage.setItem('payment_provider', 'stripe');
      window.location.href = data.checkout_url;
    } catch (e) { setError(e.message); setLoadingAction(null); }
  }

  // Determine current plan based on total purchased
  const getCurrentPlan = () => {
    if (totalPurchased >= 2000) return 'enterprise';
    if (totalPurchased >= 1000) return 'pro';
    return 'free';
  };
  const currentPlan = balance !== null ? getCurrentPlan() : null;

  if (authLoading) return <div className="pricing-loading">Loading...</div>;

  return (
    <div className={`pricing-page ${theme}`}>
      <button className="pricing-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="pricing-header">
        <h1>Simple Pricing</h1>
        <p className="pricing-subtitle">Start free. Upgrade when you need more.</p>
        {balance !== null && (
          <div className="balance-badge">
            <span className="balance-icon">🪙</span>
            <span className="balance-amount">{balance}</span>
            <span className="balance-label">credits remaining</span>
          </div>
        )}
      </div>

      {error && <div className="pricing-error">{error}</div>}

      <div className="plans-grid">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
          <div key={plan.id} className={`plan-card ${plan.popular ? 'plan-popular' : ''} ${isCurrent ? 'plan-current' : ''}`}>
            {isCurrent && <div className="current-badge">Current Plan</div>}
            {plan.popular && !isCurrent && <div className="popular-badge">Most Popular</div>}

            <div className="plan-top">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price-row">
                <span className="plan-price">{plan.price}</span>
                {plan.period && <span className="plan-period">{plan.period}</span>}
              </div>
              {plan.priceUsd && <div className="plan-price-usd">{plan.priceUsd}</div>}
              <p className="plan-desc">{plan.description}</p>
            </div>

            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}><span className="check">✓</span> {f}</li>
              ))}
            </ul>

            <div className="plan-actions">
              {isCurrent ? (
                <button className="plan-btn plan-btn-current" disabled>
                  ✓ Your Current Plan
                </button>
              ) : !plan.isPaid ? (
                <button className="plan-btn plan-btn-free" onClick={() => router.push('/dashboard')}>
                  {plan.cta}
                </button>
              ) : (
                <>
                  <button
                    className="plan-btn plan-btn-esewa"
                    onClick={() => handleEsewa(plan.id)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === `esewa-${plan.id}` ? 'Redirecting...' : '🟢 Pay with eSewa'}
                  </button>
                  {stripeAvailable && (
                    <button
                      className="plan-btn plan-btn-stripe"
                      onClick={() => handleStripe(plan.id)}
                      disabled={loadingAction !== null}
                    >
                      {loadingAction === `stripe-${plan.id}` ? 'Redirecting...' : '💳 Pay with Card (Stripe)'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Transaction History */}
      <div className="history-section">
        <button className="history-toggle" onClick={fetchHistory}>
          {showHistory ? 'Refresh History' : 'View Transaction History'}
        </button>
        {showHistory && (
          <div className="history-list">
            {history.length === 0 ? (
              <p className="history-empty">No transactions yet</p>
            ) : history.map((tx) => (
              <div key={tx.id} className={`history-item ${tx.amount > 0 ? 'credit' : 'debit'}`}>
                <div className="history-info">
                  <span className="history-action">{tx.action.replace(/_/g, ' ')}</span>
                  <span className="history-desc">{tx.description}</span>
                </div>
                <div className="history-amount">{tx.amount > 0 ? '+' : ''}{tx.amount}</div>
                <div className="history-balance">bal: {tx.balance_after}</div>
                <div className="history-date">{new Date(tx.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="back-button" onClick={() => router.push('/dashboard')}>← Back to Dashboard</button>
    </div>
  );
}
