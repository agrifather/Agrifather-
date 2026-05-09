import React, { useState } from 'react';
import { Tractor, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [otp, setOtp] = useState(['5', '', '', '']);

  const handleVerify = () => {
    navigate('/register');
  }

  return (
    <div className="welcome-container">
      <div className="logo-section">
        <div className="icon-wrapper">
          <Tractor size={32} color="#fcae59" />
        </div>
        <h1 className="brand-name">Agrifather</h1>
      </div>

      <div className="verify-card">
        <h2>{t('verifyPhone')}</h2>
        <p className="subtitle">{t('enterCode')} <span className="highlight">+91 98XXX-XXXXX</span></p>

        <div className="otp-container">
          {otp.map((digit, index) => (
            <input 
              key={index} 
              type="text" 
              maxLength="1" 
              className="otp-input" 
              value={digit}
              readOnly
            />
          ))}
        </div>

        <div className="resend-section">
          <span className="timer"><Clock size={14} className="clock-icon" /> {t('resendIn')} 00:45</span>
          <button className="resend-btn" onClick={() => {}}>{t('resendCode')}</button>
        </div>

        <button className="btn-primary" onClick={handleVerify}>
          {t('verifyContinue')} <ArrowRight size={20} />
        </button>
      </div>

      <div className="footer-text">
        <p style={{whiteSpace: 'pre-line'}}>{t('secureData')}</p>
      </div>
    </div>
  )
}

export default Welcome;
