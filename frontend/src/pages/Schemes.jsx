import React, { useEffect, useState } from 'react';
import { ArrowLeft, Landmark, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import API_BASE from '../utils/api';
import './Advisory.css';

const Schemes = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/schemes`)
      .then(res => res.json())
      .then(data => {
        setSchemes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching schemes:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="advisory-container pb-20" style={{minHeight: '100vh'}}>
      <header className="advisory-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="header-icon" />
        </div>
        <h2 className="header-title">Govt Schemes</h2>
        <div className="avatar">
          <div style={{width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2da84a", display: "flex", justifyContent: "center", alignItems: "center", color: "white"}}><span style={{fontSize: "18px"}}>👤</span></div>
        </div>
      </header>

      <div className="advisory-content">
        <span className="section-label">FINANCIAL SUPPORT</span>
        <h1 className="main-title">Available<br/><em>Subsidies & Schemes</em></h1>

        {loading ? (
          <p style={{color: '#fcae59', textAlign: 'center', marginTop: '20px'}}>Loading Schemes...</p>
        ) : (
          schemes.map((scheme, idx) => (
            <div key={idx} className="insight-card mt-24" style={{borderTop: '4px solid #a8dadc'}}>
              <div className="insight-details">
                <div className="crop-title-row">
                  <h2 className="crop-name" style={{fontSize: '1.2rem'}}>{scheme.name}</h2>
                  <div className="pest-icon-large">
                    <Landmark size={28} color="#a8dadc" />
                  </div>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                  <h3 style={{color: '#fcae59', fontSize: '1.4rem', margin: 0}}>{scheme.amount}</h3>
                  <span style={{
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    backgroundColor: scheme.status === 'Active' ? 'rgba(149, 213, 178, 0.1)' : 'rgba(252, 174, 89, 0.1)',
                    color: scheme.status === 'Active' ? '#95d5b2' : '#fcae59'
                  }}>
                    {scheme.status}
                  </span>
                </div>

                <div className="soil-temp-row" style={{marginTop: '20px'}}>
                  <div className="status-pill" style={{width: '100%'}}>
                    <Info size={14} color="#7abeff" />
                    <span>Eligibility: <strong style={{color: '#dcd6ce'}}>{scheme.eligibility}</strong></span>
                  </div>
                </div>
                
                <button className="btn-primary" style={{marginTop: '20px', padding: '12px', fontSize: '0.9rem'}}>
                  Check Eligibility Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Schemes;
