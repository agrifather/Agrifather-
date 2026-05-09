import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/logo.png';
import './Landing.css';

const Landing = () => {
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
    <div className="landing-container">
      {/* Background Particles */}
      <div className="particles">
        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
        <div className="particle p4"></div>
        <div className="particle p5"></div>
        <div className="particle p6"></div>
      </div>

      <div className="landing-content">
        <div className="branding-section">
          <div className="logo-wrapper">
            <img src={logoImg} alt="AgriFather Logo" className="logo-img" />
          </div>
          
          <h1 className="title-hi">अग्रिफादर</h1>
          <h2 className="title-en">AgriFather</h2>
          
          <div className="taglines">
            <p className="tagline-hi">आपका खेत, आपका AI साथी</p>
            <p className="tagline-en">Your Farm. Your AI Partner.</p>
          </div>
        </div>

        <div className="controls-section">
          <div className="language-row">
            {languages.map((l) => (
              <button
                key={l.id}
                className={`lang-pill ${lang === l.id ? 'active' : ''}`}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button className="get-started-pill" onClick={() => navigate('/login')}>
            शुरू करें &nbsp; Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
