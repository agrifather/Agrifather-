import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/logo.png';
import './Splash.css';

const Splash = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();

  const languages = [
    { id: 'hi', label: 'हिंदी' },
    { id: 'en', label: 'English' },
    { id: 'bn', label: 'বাংলা' },
    { id: 'te', label: 'తెలుగు' },
    { id: 'ta', label: 'தமிழ்' }
  ];

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="branding-section">
          <div className="splash-logo-wrapper">
            <img src={logoImg} alt="AgriFather Logo" className="splash-logo-img" />
          </div>
          <div className="tagline-container">
            <p className="tagline-hi">आपका खेत, आपका AI साथी</p>
            <p className="tagline-en">Your Farm. Your AI Partner.</p>
          </div>
        </div>

        <div className="controls-section">
          <div className="language-grid">
            {languages.map((l) => (
              <button
                key={l.id}
                className={`lang-btn ${lang === l.id ? 'active' : ''}`}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button className="get-started-btn" onClick={() => navigate('/login')}>
            शुरू करें &nbsp;·&nbsp; Get Started
          </button>
          <p className="splash-register-link">
            New user? <span className="splash-link" onClick={() => navigate('/register')}>Create Account / अकाउंट बनाएं</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
