import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Tractor, Droplet, Thermometer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import API_BASE from '../utils/api';
import './Advisory.css';

const SeedDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [seed, setSeed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from backend
    fetch(`${API_BASE}/api/seeds/${id}`)
      .then(res => res.json())
      .then(data => {
        setSeed(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching seed details:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="advisory-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fcae59'}}>Loading...</div>;
  }

  if (!seed || seed.message === 'Seed not found') {
    return <div className="advisory-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fcae59'}}>Seed not found.</div>;
  }

  return (
    <div className="advisory-container pb-20">
      <header className="advisory-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="header-icon" />
        </div>
        <h2 className="header-title">{seed.name} Details</h2>
        <div className="avatar">
          <div style={{width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2da84a", display: "flex", justifyContent: "center", alignItems: "center", color: "white"}}><span style={{fontSize: "18px"}}>👤</span></div>
        </div>
      </header>

      <div className="advisory-content">
        <span className="section-label">{seed.category}</span>
        <h1 className="main-title hindi-text">{seed.name}</h1>
        <p style={{color: '#dcd6ce', marginTop: '10px'}}>{seed.desc}</p>

        <div className="insight-card mt-24">
          <div className="insight-image-container">
            <img 
              src={seed.id === 'wheat' ? "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1620959445952-b8bb6d3a95aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
              alt={seed.name} 
              className="insight-image"
            />
            <div className="priority-tag">{t('highPriority')}</div>
          </div>

          <div className="insight-details">
            <div className="crop-title-row">
              <h2 className="crop-name hindi-text">{seed.price} <span style={{fontSize: '1rem'}}>{seed.unit}</span></h2>
              <div className="tractor-icon-large">
                <Tractor size={32} color="#fcae59" />
              </div>
            </div>
            
            <p className="growth-stage" style={{color: seed.trend === 'positive' ? '#95d5b2' : '#ff7a7a'}}>
              {seed.trend === 'positive' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {seed.change}
            </p>

            <div className="recommendation-box">
              <span className="rec-label">{t('recommendations')}</span>
              <p className="rec-text hindi-text">
                {t('recText')}
              </p>
            </div>

            <div className="soil-temp-row">
              <div className="status-pill">
                <Droplet size={12} color="#a8dadc" />
                <span>{t('soilMoisture')}</span>
              </div>
              <div className="status-pill">
                <Thermometer size={12} color="#95d5b2" />
                <span>{t('idealTemp')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeedDetail;
