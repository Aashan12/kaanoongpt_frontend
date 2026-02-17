'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MessageSquare, BarChart3, ChevronRight, Gavel, ArrowRight, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './Home.css';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="page-wrapper">
      <div className="bg-decoration">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* Navigation */}
      <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="logo-wrapper">
              <img src="/logo.png" alt="KaanoonGPT" className="logo-image" />
              <span className="logo-text">KAANOONGPT</span>
            </Link>

            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#pricing" className="nav-link">Pricing</a>
              <a href="#why" className="nav-link">Why Us</a>
            </div>

            <div className="nav-right">
              <Link href="/auth/login" className="btn-nav btn-login">
                Log in
              </Link>
              <Link href="/auth/signup" className="btn-nav btn-signup">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your AI Legal Assistant
            </h1>

            <p className="hero-subtitle">
              Get instant legal guidance in English or Nepali. Ask questions, watch courtroom simulations, and understand your rights.
            </p>

            <div className="hero-buttons">
              <Link href="/auth/signup" className="btn-primary">
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <button className="btn-secondary" onClick={() => {
                const videoSection = document.querySelector('.video-section');
                videoSection?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <div className="video-container">
          <h2 className="section-title">See It In Action</h2>
          <div className="video-wrapper">
            <video
              ref={videoRef}
              src="/KaanoonGPT_ AI.mp4"
              autoPlay
              loop
              muted={isMuted}
              className="video-player"
              poster="/logo.png"
            />
            <button
              className="video-sound-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">Everything you need to understand your legal rights</p>

          <div className="features-grid">
            {/* Ask the Law */}
            <Link href="/auth/login" className="feature-card">
              <div className="feature-icon-wrapper">
                <MessageSquare size={32} />
              </div>
              <h3>Ask the Law</h3>
              <p>Get instant answers to your legal questions. Chat with AI powered by real Nepali law.</p>
              <ul className="feature-checklist">
                <li>Instant responses</li>
                <li>Bilingual support</li>
                <li>24/7 available</li>
              </ul>
            </Link>

            {/* Courtroom Simulator */}
            <Link href="/auth/login" className="feature-card">
              <div className="feature-icon-wrapper">
                <Gavel size={32} />
              </div>
              <h3>Courtroom Simulator</h3>
              <p>Watch AI lawyers debate your case and see how a judge would rule.</p>
              <ul className="feature-checklist">
                <li>Real-time debates</li>
                <li>Judge verdict</li>
                <li>Learn by watching</li>
              </ul>
            </Link>

            {/* Case Predictor */}
            <div className="feature-card feature-card-coming">
              <div className="feature-icon-wrapper">
                <BarChart3 size={32} />
              </div>
              <h3>Case Predictor</h3>
              <p>Get AI predictions of your winning chances based on historical precedents.</p>
              <div className="coming-soon-badge">Coming Soon</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-section" id="why">
        <div className="why-container">
          <h2 className="section-title">Why Choose KaanoonGPT</h2>
          <p className="section-subtitle">Built for trust, accuracy, and accessibility</p>

          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">🔒</div>
              <h3>100% Confidential</h3>
              <p>Your information is encrypted and never shared with third parties.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">⚖️</div>
              <h3>Based on Real Law</h3>
              <p>Grounded in Nepal's Constitution, Civil Code, Criminal Code, and Labour Act.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🌐</div>
              <h3>Bilingual</h3>
              <p>Get answers in English or Nepali. No language barriers.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">⏰</div>
              <h3>Always Available</h3>
              <p>24/7 access. No waiting, no appointments, no expensive consultations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-container">
          <h2 className="section-title">Simple Pricing</h2>
          <p className="section-subtitle">Start free. Upgrade when you need more.</p>

          <div className="pricing-grid">
            {/* Free */}
            <div className="pricing-card">
              <h3>Free</h3>
              <div className="price">₹0<span>/month</span></div>
              <p className="price-desc">Perfect for getting started</p>
              <ul className="price-features">
                <li><CheckCircle size={16} /> 10 questions/month</li>
                <li><CheckCircle size={16} /> Basic Ask the Law</li>
                <li><CheckCircle size={16} /> 1 Courtroom Simulation</li>
              </ul>
              <Link href="/auth/signup" className="pricing-btn pricing-btn-secondary">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="pricing-card pricing-card-featured">
              <div className="pricing-badge">Most Popular</div>
              <h3>Pro</h3>
              <div className="price">₹299<span>/month</span></div>
              <p className="price-desc">For serious legal needs</p>
              <ul className="price-features">
                <li><CheckCircle size={16} /> Unlimited questions</li>
                <li><CheckCircle size={16} /> Advanced Ask the Law</li>
                <li><CheckCircle size={16} /> Unlimited Simulations</li>
                <li><CheckCircle size={16} /> Priority support</li>
              </ul>
              <Link href="/auth/signup" className="pricing-btn pricing-btn-primary">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <p className="price-desc">For organizations & firms</p>
              <ul className="price-features">
                <li><CheckCircle size={16} /> Everything in Pro</li>
                <li><CheckCircle size={16} /> Team accounts</li>
                <li><CheckCircle size={16} /> API access</li>
                <li><CheckCircle size={16} /> Dedicated support</li>
              </ul>
              <button className="pricing-btn pricing-btn-secondary">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Take Control of Your Legal Future?</h2>
          <p>Join hundreds of Nepali citizens using KaanoonGPT to understand their rights.</p>
          <Link href="/auth/signup" className="btn-primary">
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src="/logo.png" alt="KaanoonGPT" />
            <span>KAANOONGPT</span>
          </div>
          <p>Making legal justice accessible to everyone in Nepal.</p>
          <p className="footer-copyright">© 2024 KaanoonGPT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
