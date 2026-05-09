import { ArrowLeft, Calendar, Tractor, Droplet, Thermometer, Bug, CloudLightning, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import './Advisory.css';

const Advisory = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="advisory-container pb-20">
      {/* Header */}
      <header className="advisory-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="header-icon" />
        </div>
        <h2 className="header-title">{t('cropAdvisory')}</h2>
        <div className="avatar">
          <div style={{width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2da84a", display: "flex", justifyContent: "center", alignItems: "center", color: "white"}}><span style={{fontSize: "18px"}}>👤</span></div>
        </div>
      </header>

      <div className="advisory-content">
        <span className="section-label">{t('fieldInsights')}</span>
        <h1 className="main-title hindi-text" style={{whiteSpace: 'pre-line'}}>{t('personalizedGuidance')}</h1>

        <div className="date-picker">
          <Calendar size={16} className="calendar-icon" />
          <span>OCT 24, 2023</span>
        </div>

        <div className="insight-card">
          <div className="insight-image-container">
            <img 
              src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Wheat Field" 
              className="insight-image"
            />
            <div className="priority-tag">{t('highPriority')}</div>
          </div>

          <div className="insight-details">
            <div className="crop-title-row">
              <h2 className="crop-name hindi-text">{t('wheatCrop')}</h2>
              <div className="tractor-icon-large">
                <Tractor size={32} color="#fcae59" />
              </div>
            </div>
            
            <p className="growth-stage hindi-text">{t('growthStage')}</p>

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

        {/* Pest Prevention Card */}
        <div className="insight-card mt-24">
          <div className="insight-image-container pest-image-container">
            <img 
              src="https://images.unsplash.com/photo-1620959445952-b8bb6d3a95aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Leaf with drops" 
              className="insight-image"
            />
            <div className="priority-tag preventative-tag">{t('preventative')}</div>
          </div>

          <div className="insight-details">
            <div className="crop-title-row">
              <h2 className="crop-name hindi-text">{t('pestPrevention')}</h2>
              <div className="pest-icon-large">
                <Bug size={32} color="#95d5b2" />
              </div>
            </div>
            
            <p className="growth-stage hindi-text">{t('statusMonitoring')}</p>

            <div className="recommendation-box action-required">
              <span className="rec-label text-green">{t('actionRequired')}</span>
              <p className="rec-text hindi-text">
                {t('pestActionText')}
              </p>
            </div>

            <div className="view-protocol">
              <span>{t('viewDetailedProtocol')}</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* Rain Alert Card */}
        <div className="insight-card mt-24">
          <div className="insight-details rain-alert-details">
            <div className="rain-header">
              <CloudLightning size={48} color="#e6dfd8" />
              <h2 className="crop-name hindi-text mt-16">{t('upcomingRainAlert')}</h2>
            </div>

            <p className="rec-text hindi-text mt-16">
              {t('rainAlertText')}
            </p>

            <div className="prob-circle-container">
              <div className="prob-circle">
                <div className="prob-value">75<span className="percent">%</span></div>
                <div className="prob-label">{t('precipitationProb')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Advisory;
