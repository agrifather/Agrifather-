import React, { useState, useEffect } from 'react';
import { X, User, MessageSquare, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import SEO from '../components/SEO';

import { getRecentConversations, timeAgo } from '../utils/chatHistory';
import { getUserItem, setUserItem } from '../utils/userStorage';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';


// ── Pick emoji based on message text ─────────────────────────────────────────
function topicEmoji(text = '') {
  const t = text.toLowerCase();
  if (t.includes('pest') || t.includes('insect') || t.includes('कीट'))        return '🐛';
  if (t.includes('weather') || t.includes('rain') || t.includes('मौसम'))       return '🌦️';
  if (t.includes('soil') || t.includes('मिट्टी'))                               return '🪱';
  if (t.includes('water') || t.includes('irrigation') || t.includes('सिंचाई')) return '💧';
  if (t.includes('cotton') || t.includes('कपास'))                               return '☁️';
  if (t.includes('scheme') || t.includes('kisan') || t.includes('योजना'))      return '🏛️';
  if (t.includes('market') || t.includes('mandi') || t.includes('मंडी'))       return '📊';
  if (t.includes('cow') || t.includes('livestock') || t.includes('गाय'))       return '🐄';
  return '🌾';
}

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [alertVisible, setAlertVisible] = useState(false);
  const [locationStr,  setLocationStr]  = useState(getUserItem('af_location', ''));
  const [weatherStr,   setWeatherStr]   = useState('🌤️ Loading weather...');
  const [recentChats,  setRecentChats]  = useState([]);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  })();
  const greeting = user.name
    ? `${t('greeting')}, ${user.name.split(' ')[0]} ${t('greetingSuffix')}`
    : t('greetingFarmer');
  const today = new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

  // Load real chat history on mount
  useEffect(() => {
    setRecentChats(getRecentConversations(5));
  }, []);

  // Location detection
  useEffect(() => {
    let currentLoc = locationStr;
    if (!currentLoc) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Location';
              const state = data.address.state || '';
              const detectedLoc = `${city}${state ? `, ${state}` : ''}`;
              
              setLocationStr(detectedLoc);
              setUserItem('af_location', detectedLoc);
            } catch (err) {
              console.error('Reverse geocoding failed:', err);
              fallbackPrompt();
            }
          },
          (err) => {
            console.error('Geolocation error:', err);
            fallbackPrompt();
          }
        );
      } else {
        fallbackPrompt();
      }
    }

    function fallbackPrompt() {
      const userInput = window.prompt('Please enter your City or Village name to show local weather:', 'Nagpur');
      const loc = userInput || 'Nagpur, Maharashtra';
      setLocationStr(loc);
      setUserItem('af_location', loc);
    }
  }, []);

  // Weather fetching
  useEffect(() => {
    if (!locationStr) return;
    
    const locLower = locationStr.toLowerCase();
    const isHighRisk = ['rajasthan', 'gujarat', 'punjab', 'haryana'].some(state => locLower.includes(state));
    setAlertVisible(isHighRisk);

    fetch(`https://wttr.in/${encodeURIComponent(locationStr)}?format=j1`)
      .then(res  => res.json())
      .then(data => {
        const temp = data.current_condition[0].temp_C;
        const desc = data.current_condition[0].weatherDesc[0].value;
        setWeatherStr(`🌤️ ${temp}°C, ${desc}`);
      })
      .catch(() => setWeatherStr('🌤️ 28°C, Partly Cloudy'));
  }, [locationStr]);

  return (
    <div className="home-container pb-20">
      <SEO 
        title="Home" 
        description="Your personalized farming dashboard on AgriFather. Access crop advisory, pest ID, and weather forecasts."
      />

      {/* Header */}

      <header className="home-header">
        <div className="header-brand">
          <h2 className="brand-text">AgriFather</h2>
        </div>
        <div className="header-right">
          <div className="avatar-green" onClick={() => navigate('/profile')}>
            <User size={20} color="white" />
          </div>
        </div>
      </header>

      {/* Greeting */}
      <div className="greeting-section">
        <h2 className="greeting-title">{greeting}</h2>
        <p className="greeting-date">{today} • {locationStr}</p>
        <p className="greeting-weather">{weatherStr}</p>
      </div>

      {/* Alert */}
      {alertVisible && (
        <div className="alert-widget">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text-wrapper">
              <span className="alert-text">{t('locustAlert')}</span>
              <span className="alert-en">{t('locustAlertEn')}</span>
            </div>
          </div>
          <X size={18} color="#666" className="alert-close" onClick={() => setAlertVisible(false)} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="home-section">
        <h3 className="section-title">{t('quickActions')}</h3>
        <div className="quick-actions-grid">
          <div className="action-card crop-card" onClick={() => navigate('/chat')}>
            <span className="card-emoji">🌾</span>
            <div className="card-text-wrapper">
              <span className="card-hi">{t('cropAdvisory')}</span>
            </div>
          </div>
          <div className="action-card pest-card" onClick={() => navigate('/pest-id')}>
            <span className="card-emoji">🐛</span>
            <div className="card-text-wrapper">
              <span className="card-hi">{t('pestId')}</span>
            </div>
          </div>
          <div className="action-card weather-card" onClick={() => navigate('/weather')}>
            <span className="card-emoji">🌦️</span>
            <div className="card-text-wrapper">
              <span className="card-hi">{t('weather')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Conversations — REAL HISTORY */}
      <div className="home-section">
        <div className="section-header-flex">
          <h3 className="section-title">{t('recentConv')}</h3>
          <span className="view-all" onClick={() => navigate('/chat')}>{t('viewAll')}</span>
        </div>

        {recentChats.length === 0 ? (
          <div className="conv-empty" onClick={() => navigate('/chat')}>
            <MessageSquare size={32} color="var(--text-muted)" strokeWidth={1.5} />
            <p className="conv-empty-text">{t('noConvYet')}</p>
            <p className="conv-empty-sub">{t('noConvSub')}</p>
          </div>
        ) : (
          <div className="conversation-list">
            {recentChats.map((conv) => (
              <div key={conv.id} className="conv-item" onClick={() => navigate('/chat')}>
                <span className="conv-icon">{topicEmoji(conv.userText)}</span>
                <div className="conv-text">
                  <h4 className="conv-title">
                    {conv.userText.length > 52
                      ? conv.userText.slice(0, 52) + '…'
                      : conv.userText}
                  </h4>
                  <p className="conv-time">{timeAgo(conv.timestamp)}</p>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
