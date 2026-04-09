'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '../../lib/api';
import '../pricing.css';

function VerifyPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    verify();
  }, []);

  async function verify() {
    const token = localStorage.getItem('access_token');
    if (!token) { setStatus('error'); setError('Not authenticated.'); return; }

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // Detect provider: if `data` param exists, it's eSewa. If `session_id`, it's Stripe.
    const esewaData = searchParams.get('data');
    const stripeSessionId = searchParams.get('session_id') || localStorage.getItem('stripe_session_id');
    const txUuid = localStorage.getItem('esewa_tx_uuid');

    try {
      let res;

      if (stripeSessionId && !esewaData) {
        // Stripe flow
        res = await fetch(`${API_URL}/api/kanoongpt/payments/stripe/verify`, {
          method: 'POST', headers,
          body: JSON.stringify({ session_id: stripeSessionId }),
        });
      } else if (txUuid) {
        // eSewa flow — pass the Base64 data from redirect
        res = await fetch(`${API_URL}/api/kanoongpt/payments/verify`, {
          method: 'POST', headers,
          body: JSON.stringify({ transaction_uuid: txUuid, esewa_data: esewaData || '' }),
        });
      } else {
        router.push('/pricing');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setResult(data);
        localStorage.removeItem('esewa_tx_uuid');
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('payment_provider');
      } else {
        setStatus('error');
        setError(data.detail || 'Verification failed');
      }
    } catch (e) {
      setStatus('error');
      setError(e.message);
    }
  }

  return (
    <div className="pricing-page" style={{ textAlign: 'center', paddingTop: '80px' }}>
      {status === 'verifying' && (
        <div>
          <h2 style={{ color: '#60a5fa' }}>Verifying Payment...</h2>
          <p style={{ color: '#999' }}>Please wait while we confirm your payment.</p>
        </div>
      )}
      {status === 'success' && result && (
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#4ade80' }}>Payment Successful</h2>
          <p style={{ color: '#ccc', fontSize: '1.2rem', margin: '16px 0' }}>
            {result.tokens_credited} credits added to your account
          </p>
          <p style={{ color: '#60a5fa', fontSize: '1.1rem' }}>New balance: {result.new_balance} credits</p>
          <br />
          <button className="plan-btn plan-btn-esewa" style={{ maxWidth: '300px', margin: '16px auto' }} onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      )}
      {status === 'error' && (
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>❌</div>
          <h2 style={{ color: '#f87171' }}>Verification Failed</h2>
          <p style={{ color: '#999' }}>{error}</p>
          <button className="plan-btn plan-btn-stripe" style={{ maxWidth: '300px', margin: '24px auto' }} onClick={() => router.push('/pricing')}>
            Back to Pricing
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="pricing-page" style={{ textAlign: 'center', paddingTop: '80px' }}><p style={{ color: '#999' }}>Loading...</p></div>}>
      <VerifyPayment />
    </Suspense>
  );
}
