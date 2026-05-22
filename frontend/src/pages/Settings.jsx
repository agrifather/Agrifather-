import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, Globe, Volume2, MessageSquare, Bell, Shield, HelpCircle, Scale, HardDrive, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserItem, setUserItem } from '../utils/userStorage';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme, setDarkMode } = useTheme();
  const { t, langLabel, setLang } = useLanguage();

  const [voiceMode, setVoiceMode]           = useState(false); // Coming soon — keep off by default
  const [notifications, setNotifications]  = useState(() => getUserItem('af_notifications') !== 'false');
  const [responseStyle, setResponseStyle]   = useState(() => getUserItem('af_responseStyle', 'Detailed'));
  const [modal, setModal]                   = useState(null); // 'privacy' | 'help' | null
  const [toast, setToast]                   = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => { setUserItem('af_voiceMode', voiceMode); }, [voiceMode]);
  useEffect(() => { setUserItem('af_notifications', notifications); }, [notifications]);
  useEffect(() => { setUserItem('af_responseStyle', responseStyle); }, [responseStyle]);

  const Toggle = ({ on, onChange }) => (
    <div className={`toggle-switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <div className="toggle-knob" />
    </div>
  );

  return (
    <div className="settings-page">
      {/* ── Toast Notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,20,0.92)', backdropFilter: 'blur(10px)',
          color: '#fff', padding: '12px 22px', borderRadius: 12,
          fontSize: '0.88rem', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          maxWidth: '90vw', textAlign: 'center',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast}
        </div>
      )}

      <div className="settings-header">
        <ArrowLeft size={24} className="back-icon" onClick={() => navigate(-1)} />
        <h2 className="header-title hindi-text">{t('settings')}</h2>
      </div>

      <div className="settings-content">

        {/* APPEARANCE */}
        <div className="settings-section">
          <h3 className="section-heading hindi-text">{t('appearance')}</h3>
          <div className={`setting-card active-card`}>
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                {darkMode ? <Moon size={20} color="#2da84a" /> : <Sun size={20} color="#2da84a" />}
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">{t('theme')}</h4>
                <p className="setting-subtitle">{darkMode ? t('darkMode') : t('lightMode')}</p>
              </div>
            </div>
            <div className="setting-right">
              <Toggle on={darkMode} onChange={setDarkMode} />
            </div>
          </div>
        </div>

        {/* PREFERENCES */}
        <div className="settings-section">
          <h3 className="section-heading hindi-text">{t('preferences')}</h3>

          {/* Language */}
          <div className="setting-card">
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <Globe size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">{t('language')}</h4>
                <p className="setting-subtitle">{t('appLang')}</p>
              </div>
            </div>
            <div className="setting-right">
              <select
                className="settings-select"
                value={langLabel}
                onChange={(e) => setLang(e.target.value)}
              >
                {['Hindi', 'English', 'Marathi', 'Punjabi', 'Gujarati', 'Telugu', 'Tamil', 'Kannada', 'Bengali', 'Malayalam'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Voice Mode — Coming Soon */}
          <div className="setting-card" style={{ position: 'relative' }}>
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <Volume2 size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t('voiceMode')}
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.5,
                    background: 'linear-gradient(90deg,#f59e0b,#ef4444)',
                    color: '#fff', borderRadius: 20, padding: '2px 8px'
                  }}>SOON</span>
                </h4>
                <p className="setting-subtitle">This feature is coming soon!</p>
              </div>
            </div>
            <div className="setting-right">
              <Toggle
                on={voiceMode}
                onChange={(val) => {
                  if (val) {
                    showToast('🎙️ Voice Mode responses are coming soon! We are working on it. / जल्द आने वाला है!');
                  } else {
                    setVoiceMode(false);
                  }
                }}
              />
            </div>
          </div>

          {/* Response Style */}
          <div className="setting-card">
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <MessageSquare size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">{t('responseStyle')}</h4>
                <p className="setting-subtitle">{t('aiLength')}</p>
              </div>
            </div>
            <div className="setting-right">
              <select
                className="settings-select"
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value)}
              >
                <option value="Brief">Brief</option>
                <option value="Detailed">Detailed</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="settings-section">
          <h3 className="section-heading hindi-text">{t('notifications')}</h3>
          <div className="setting-card">
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <Bell size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">{t('pushNotif')}</h4>
                <p className="setting-subtitle">{t('alertsUpdates')}</p>
              </div>
            </div>
            <div className="setting-right">
              <Toggle on={notifications} onChange={setNotifications} />
            </div>
          </div>
        </div>

        {/* SUPPORT */}
        <div className="settings-section">
          <h3 className="section-heading hindi-text">{t('support')}</h3>

          <div className="setting-card setting-card-btn" onClick={() => navigate('/privacy')}>
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <Shield size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">{t('privacyPolicy')}</h4>
                <p className="setting-subtitle">{t('readPrivacy')}</p>
              </div>
            </div>
            <span className="setting-arrow">›</span>
          </div>

          <div className="setting-card setting-card-btn" onClick={() => navigate('/terms')}>
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <Scale size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">Terms &amp; Conditions</h4>
                <p className="setting-subtitle">Read User Agreement &amp; AI Disclaimers</p>
              </div>
            </div>
            <span className="setting-arrow">›</span>
          </div>

          <div className="setting-card setting-card-btn" onClick={() => navigate('/cookies')}>
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <HardDrive size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">Cookie &amp; Storage Policy</h4>
                <p className="setting-subtitle">LocalStorage usage &amp; data keys</p>
              </div>
            </div>
            <span className="setting-arrow">›</span>
          </div>

          <div className="setting-card setting-card-btn" onClick={() => setModal('help')}>
            <div className="setting-left">
              <div className="setting-icon-wrapper">
                <HelpCircle size={20} color="#2da84a" />
              </div>
              <div className="setting-text">
                <h4 className="setting-title hindi-text">{t('helpSupport')}</h4>
                <p className="setting-subtitle">{t('faqContact')}</p>
              </div>
            </div>
            <span className="setting-arrow">›</span>
          </div>
        </div>

        <div className="settings-section">
          <button 
            className="logout-btn" 
            onClick={() => {
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            {t('logout')}
          </button>
        </div>

        <div className="footer-credits">
          <p>AgriFather v1.0.0</p>
          <p>made with love for farmers</p>
        </div>
      </div>

      <BottomNav />

      {/* ── Modal ── */}
      {modal && (
        <div className="settings-modal-overlay" onClick={() => setModal(null)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
            {modal === 'privacy' && (
              <>
                <h3>{t('privacyPolicy')}</h3>
                <p>AgriFather collects only the information you provide (name, mobile number, crop preference) to personalise your farming experience. Your data is never sold to third parties.</p>
                <p>All AI conversations are processed via OpenRouter and are not stored on our servers beyond the current session.</p>
                <p>For queries, contact: <strong>support@agrifather.com</strong></p>
                <p style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  For the full User Agreement and Business/Product terms, please read our <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms &amp; Conditions</a>.
                </p>
              </>
            )}
            {modal === 'help' && (
              <>
                <h3>{t('helpSupport')}</h3>
                <p><strong>Q: How do I scan my crop?</strong><br />Go to the Scanner tab, tap Camera or Gallery, select an image, then tap "Analyze with AI".</p>
                <p><strong>Q: How does OTP login work?</strong><br />Enter your registered mobile number and tap "Login with OTP".</p>
                <p><strong>Q: Who do I contact for help?</strong><br />Email us at <strong>support@agrifather.com</strong> or call <strong>1800-XXX-XXXX</strong>.</p>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
