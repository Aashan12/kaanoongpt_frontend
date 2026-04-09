'use client';

import { useRouter } from 'next/navigation';
import '../pricing.css';

export default function PaymentFailurePage() {
  const router = useRouter();

  return (
    <div className="pricing-page" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>❌</div>
      <h2 style={{ color: '#f87171' }}>Payment Cancelled</h2>
      <p style={{ color: '#999', margin: '16px 0' }}>
        Your eSewa payment was cancelled or failed. No tokens were deducted.
      </p>
      <button
        className="buy-button"
        style={{ maxWidth: '300px', marginTop: '24px' }}
        onClick={() => router.push('/pricing')}
      >
        Try Again
      </button>
    </div>
  );
}
