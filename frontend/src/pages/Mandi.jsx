import React, { useEffect, useState } from 'react';
import { Bell, Search, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import API_BASE from '../utils/api';
import './Mandi.css';


const Mandi = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crops'); // 'crops' or 'fertilizers'

  useEffect(() => {
    setLoading(true);
    const endpoint = activeTab === 'crops' ? '/api/market/prices' : '/api/market/fertilizers';
    fetch(`${API_BASE}${endpoint}`)
      .then(res => res.json())
      .then(data => {
        setMarketData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching market data:", err);
        setLoading(false);
      });
  }, [activeTab]);

  return (
    <div className="mandi-container pb-20">
      <SEO 
        title="Mandi Prices" 
        description="Check real-time mandi prices and market trends on AgriFather. Stay updated with the latest rates for your crops."
      />
      {/* Header */}

      <header className="mandi-header">
        <div className="header-left">
          <div className="avatar" onClick={() => navigate('/home')} style={{cursor: 'pointer'}}>
            <div style={{width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2da84a", display: "flex", justifyContent: "center", alignItems: "center", color: "white"}}><span style={{fontSize: "18px"}}>👤</span></div>
          </div>
          <h2 className="brand-small mb-0">Agrifather</h2>
        </div>
        <div className="notification-wrapper" onClick={() => navigate('/home')} style={{cursor: 'pointer'}}>
          <Bell size={20} className="header-icon" />
          <span className="badge"></span>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder={t('searchCrops')} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mandi-tabs-container">
        <div className="mandi-tabs">
          <button 
            className={`mandi-tab ${activeTab === 'crops' ? 'active' : ''}`}
            onClick={() => setActiveTab('crops')}
          >
            Real-time Mandi (Crops/Fruits)
          </button>
          <button 
            className={`mandi-tab ${activeTab === 'fertilizers' ? 'active' : ''}`}
            onClick={() => setActiveTab('fertilizers')}
          >
            Fertilizers / उर्वरक
          </button>
        </div>
        {/* Fake scrollbar track below tabs matching design */}
        <div className="scroll-indicator">
          <div className="scroll-thumb"></div>
        </div>
      </div>

      <div className="mandi-content">
        {loading ? (
          <div className="loading-container" style={{padding: '40px', textAlign: 'center'}}>
            <div className="login-spinner" style={{borderColor: 'rgba(45, 168, 74, 0.2)', borderTopColor: '#2da84a', width: '40px', height: '40px'}}></div>
            <p style={{color: '#2da84a', marginTop: '16px', fontWeight: '500'}}>Fetching live market rates...</p>
          </div>
        ) : (
          marketData.map((item, index) => (
            <div key={item.id} className="market-card" onClick={() => item.category === 'FERTILIZER' ? null : navigate(`/seed/${item.id}`)} style={{cursor: item.category === 'FERTILIZER' ? 'default' : 'pointer'}}>
              <div className="market-card-header">
                <div className="crop-info">
                  <span className={`category-tag ${item.category === 'FERTILIZER' ? 'text-orange' : 'text-green'}`}>{item.category}</span>
                  <h3 className="hindi-text crop-name">{item.name}</h3>
                  <p className="hindi-text crop-sub">{item.sub}</p>
                </div>
                <div className="price-info">
                  <h3 className="price text-orange">{item.price} <span className="unit">{item.unit}</span></h3>
                  <span className={`trend ${item.trend}`}>
                    {item.trend === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {item.change}
                  </span>
                </div>
              </div>
              <div className="chart-container">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="trend-line">
                  {seed.trend === 'positive' ? (
                    <>
                      <path d="M0,25 C15,25 25,15 40,20 C55,25 65,5 80,15 C90,22 95,10 100,5" fill="none" stroke="url(#orange-grad)" strokeWidth="2"/>
                      <path d="M0,25 C15,25 25,15 40,20 C55,25 65,5 80,15 C90,22 95,10 100,5 L100,30 L0,30 Z" fill="url(#orange-fade)" opacity="0.2"/>
                    </>
                  ) : (
                    <>
                      <path d="M0,15 C20,15 30,25 45,20 C60,15 65,5 80,18 C90,25 95,28 100,28" fill="none" stroke="url(#orange-grad)" strokeWidth="2"/>
                      <path d="M0,15 C20,15 30,25 45,20 C60,15 65,5 80,18 C90,25 95,28 100,28 L100,30 L0,30 Z" fill="url(#orange-fade)" opacity="0.2"/>
                    </>
                  )}
                  <defs>
                    <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fcae59" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#fcae59" stopOpacity="1" />
                      <stop offset="100%" stopColor="#fcae59" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="orange-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fcae59" stopOpacity="1" />
                      <stop offset="100%" stopColor="#fcae59" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          ))
        )}

        {/* Market Sentiment Card */}
        <div className="sentiment-card">
          <div className="sentiment-content">
            <h3 className="sentiment-title">{t('marketSentiment')}</h3>
            <p className="sentiment-desc hindi-text">
              {t('sentimentText')}
            </p>
            <div className="full-analysis">
              <span>{t('fullAnalysis')}</span>
              <ArrowRight size={14} />
            </div>
          </div>
          <TrendingUp className="bg-icon" size={120} />
        </div>

        {/* Digital Mandi Hub Card */}
        <div className="hub-card">
          <div className="hub-content">
            <h3 className="hub-title">{t('digitalMandiHub')}</h3>
            <p className="hub-desc hindi-text">
              {t('mandiHubText')}
            </p>
            
            <div className="hub-stats">
              <div className="stat-item">
                <h4 className="stat-value text-orange">4.2k+</h4>
                <span className="stat-label">{t('activeBuyers')}</span>
              </div>
              <div className="stat-item">
                <h4 className="stat-value text-orange">98%</h4>
                <span className="stat-label">{t('priceAccuracy')}</span>
              </div>
            </div>

            <div className="hub-image-container">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Rural Market" 
                className="hub-image"
              />
              <div className="hub-overlay">
                <div className="market-text">
                  <span className="rural text-orange">RURAL MARKET</span>
                  <span className="safe">SAFE WORK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default Mandi;
