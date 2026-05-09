import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mic, Camera, BarChart2, CloudRain, ShieldCheck, ArrowRight, Smartphone, Star } from 'lucide-react';
import './Landing.css';

const FEATURES = [
  { icon: <Leaf size={26} />, title: 'AI Crop Doctor', desc: 'Get instant diagnosis for any plant disease in seconds using our AI.' },
  { icon: <Camera size={26} />, title: 'Image Scanner', desc: 'Take a photo of your crop and let AI identify pests & diseases.' },
  { icon: <Mic size={26} />, title: 'Voice in Hindi', desc: 'Ask questions in Hindi, Marathi, Punjabi — our AI understands you.' },
  { icon: <BarChart2 size={26} />, title: 'Live Mandi Rates', desc: 'Real-time crop prices from mandis across India, updated daily.' },
  { icon: <CloudRain size={26} />, title: 'Weather Alerts', desc: 'Hyperlocal weather forecasts tailored to your farm location.' },
  { icon: <ShieldCheck size={26} />, title: 'Govt Schemes', desc: 'PM Kisan, PMFBY, KCC and more — never miss a benefit again.' },
];

const STATS = [
  { value: '50,000+', label: 'Farmers Helped' },
  { value: '6', label: 'Languages Supported' },
  { value: '24/7', label: 'AI Available' },
  { value: '99%', label: 'Accuracy Rate' },
];

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page">

      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">
          <div className="nav-logo"><Leaf size={20} color="#fff" /></div>
          <span>AgriFather</span>
        </div>
        <div className="nav-actions">
          <button className="nav-login-btn" onClick={() => navigate('/login')}>Login</button>
          <button className="nav-cta-btn" onClick={() => navigate('/register')}>Get Started Free</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-bg-orb orb1" />
        <div className="hero-bg-orb orb2" />
        <div className="hero-content">
          <div className="hero-badge">🌾 AI-Powered Farming Assistant</div>
          <h1 className="hero-title">
            Your Smart<br />
            <span className="hero-gradient">Farming Partner</span>
          </h1>
          <p className="hero-sub">
            AgriFather uses cutting-edge AI to help Indian farmers with crop diseases, mandi rates, weather forecasts, and government schemes — in your local language.
          </p>
          <p className="hero-sub-hi">आपका खेत, आपका AI साथी 🌱</p>
          <div className="hero-btn-row">
            <button className="hero-primary-btn" onClick={() => navigate('/register')}>
              Start for Free <ArrowRight size={18} />
            </button>
            <button className="hero-secondary-btn" onClick={() => navigate('/login')}>
              Already a farmer? Login
            </button>
          </div>
          <div className="hero-trust">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
            <span>Trusted by 50,000+ farmers across India</span>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="hero-phone-wrap">
          <div className="hero-phone">
            <div className="phone-screen">
              <div className="phone-header">
                <div className="phone-dot ai-dot"><Leaf size={10} color="#fff" /></div>
                <span>AgriFather AI</span>
                <div className="phone-status">● Online</div>
              </div>
              <div className="phone-chat">
                <div className="phone-msg ai">Namaskar! Mujhse kheti ke baare mein poochhen 🌾</div>
                <div className="phone-msg user">मेरी गेहूं की फसल में पीले धब्बे हैं</div>
                <div className="phone-msg ai">यह गेहूं का पीला रतुआ रोग हो सकता है। Propiconazole spray करें...</div>
              </div>
              <div className="phone-input-bar">
                <span>Message AgriFather AI...</span>
                <div className="phone-mic"><Mic size={12} color="#10a37f" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <div className="section-header">
          <h2>Everything You Need to Farm Smart</h2>
          <p>Powerful tools built specifically for Indian farmers</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing-cta-section">
        <div className="cta-inner">
          <Smartphone size={40} color="#10a37f" />
          <h2>Start Your Free Account Today</h2>
          <p>Join thousands of Indian farmers who are farming smarter with AgriFather AI</p>
          <button className="hero-primary-btn large" onClick={() => navigate('/register')}>
            Create Free Account <ArrowRight size={18} />
          </button>
          <p className="cta-note">No credit card required • Free forever for basic use</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <div className="nav-logo"><Leaf size={16} color="#fff" /></div>
          <span>AgriFather</span>
        </div>
        <p>© 2025 AgriFather. Built with ❤️ for Indian Farmers.</p>
        <div className="footer-links">
          <span onClick={() => navigate('/login')}>Login</span>
          <span onClick={() => navigate('/register')}>Register</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
