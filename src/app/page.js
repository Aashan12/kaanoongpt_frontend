'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Gavel, MessageSquare, BarChart3, Scale } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './Home.css';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <nav className="nav">
        <div className="nav-left">
          <img src="/logo.jpeg" alt="KAANOONGPT Logo" className="logo-image" />
          <span className="logo-text">KAANOONGPT</span>
        </div>
        <div className="nav-right">
          <Link href="/auth/login">
            <button className="btn-login">Log in</button>
          </Link>
          <Link href="/auth/signup">
            <button className="btn-signup">Sign up for free</button>
          </Link>
          <button className="btn-settings">
            <Settings size={24} strokeWidth={2} />
          </button>
        </div>
      </nav>

      <main className="main-padding">
        <div className="hero text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full inline-block">
              <Scale size={64} strokeWidth={2.5} className="text-white" />
            </div>
          </div>
          <h1 className="hero-title-new">Welcome to Kaanoongpt</h1>
          <p className="hero-subtitle max-w-3xl mx-auto">
            Your AI Legal Companion — Ask Law, Watch Lawyers Argue, See the Verdict.
          </p>
        </div>

        <div className="features-grid">
          <div className="card card-white">
            <div className="card-icon-bg bg-yellow-100">
              <Gavel size={48} className="text-yellow-600" />
            </div>
            <h2 className="card-title">Courtroom Simulator</h2>
            <p className="card-desc">
              Watch AI lawyers debate your case and the judge deliver a verdict — just like a real courtroom
            </p>
            <button className="card-btn bg-yellow-500 text-black hover:bg-yellow-600">
              Agent Battle Mode
            </button>
          </div>

          <div className="card card-gold">
            <div className="card-icon-bg card-icon-green bg-blue-100">
              <MessageSquare size={48} className="text-blue-600" />
            </div>
            <h2 className="card-title">Ask the Law</h2>
            <p className="card-desc card-desc-dark">
              Chat with AI to get clear answers on Nepali laws in English or Nepali - anytime, anywhere
            </p>
            <button className="card-btn bg-white text-blue-600 hover:bg-gray-100">
              Q&A Bot
            </button>
          </div>

          <div className="card card-white">
            <div className="card-icon-bg bg-green-100">
              <BarChart3 size={48} className="text-green-600" />
            </div>
            <h2 className="card-title">Case Predictor</h2>
            <p className="card-desc">
              Upload case details and discover the probability of winning, backed by past precedents.
            </p>
            <button className="card-btn bg-gray-300 text-gray-700 cursor-not-allowed" disabled>
              Coming Soon
            </button>
          </div>
        </div>

        <div className="footer">
          <p>
            By using this app, you agree to our{' '}
            <Link href="/terms" className="footer-link">Terms</Link> of Service and{' '}
            <Link href="/privacy" className="footer-link">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}