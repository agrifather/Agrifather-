import React, { useEffect, useState } from 'react';
import { ArrowLeft, PawPrint, Activity, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import API_BASE from '../utils/api';
import './Advisory.css';

const Livestock = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/livestock`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching livestock:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="advisory-container pb-20" style={{minHeight: '100vh'}}>
      <header className="advisory-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="header-icon" />
        </div>
        <h2 className="header-title">Livestock Management</h2>
        <div className="avatar">
          <div style={{width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2da84a", display: "flex", justifyContent: "center", alignItems: "center", color: "white"}}><span style={{fontSize: "18px"}}>👤</span></div>
        </div>
      </header>

      <div className="advisory-content">
        <span className="section-label">FARM ANIMALS</span>
        <h1 className="main-title">Monitor Your<br/><em>Herd Health</em></h1>

        {loading ? (
          <p style={{color: '#fcae59', textAlign: 'center', marginTop: '20px'}}>Loading Livestock Data...</p>
        ) : (
          data.map((animal, idx) => (
            <div key={idx} className="insight-card mt-24">
              <div className="insight-details">
                <div className="crop-title-row">
                  <h2 className="crop-name">{animal.type} <span style={{fontSize: '1rem', color: '#7d7268'}}>({animal.count} heads)</span></h2>
                  <div className="pest-icon-large">
                    <PawPrint size={32} color={animal.status === 'Healthy' ? '#95d5b2' : '#ff7a7a'} />
                  </div>
                </div>
                
                <p className="growth-stage" style={{color: animal.status === 'Healthy' ? '#95d5b2' : '#ff7a7a'}}>
                  <Activity size={16} style={{display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom'}}/>
                  Status: {animal.status}
                </p>

                <div className="recommendation-box" style={{borderLeftColor: '#fcae59', marginTop: '15px'}}>
                  <span className="rec-label" style={{color: '#fcae59'}}>FEED SCHEDULE</span>
                  <p className="rec-text">{animal.feed}</p>
                </div>

                <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dcd6ce', fontSize: '0.9rem'}}>
                  <Calendar size={16} color="#a8dadc" />
                  <span>Next Vaccination: <strong style={{color: '#fcae59'}}>{animal.nextVaccination}</strong></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Livestock;
