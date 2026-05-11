import React, { useState } from 'react';
import { ArrowLeft, Bug, Upload, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import SEO from '../components/SEO';
import API_BASE from '../utils/api';
import './Advisory.css';


const PestId = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = () => {
    setLoading(true);
    // Simulate API call for pest identification
    fetch(`${API_BASE}/api/pest-id`, {
      method: 'POST',
    })
      .then(res => res.json())
      .then(data => {
        setTimeout(() => { // Add a little delay for visual effect
          setResult(data);
          setLoading(false);
        }, 1500);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="advisory-container pb-20" style={{minHeight: '100vh'}}>
      <SEO 
        title="AI Pest Identifier" 
        description="Identify crop pests and diseases instantly with AgriFather's AI tool. Get treatment recommendations to save your harvest."
      />
      <header className="advisory-header">

        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="header-icon" />
        </div>
        <h2 className="header-title">AI Pest Identifier</h2>
        <div className="avatar">
          <div style={{width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2da84a", display: "flex", justifyContent: "center", alignItems: "center", color: "white"}}><span style={{fontSize: "18px"}}>👤</span></div>
        </div>
      </header>

      <div className="advisory-content">
        <span className="section-label">SCAN CROP</span>
        <h1 className="main-title">Upload a Photo for<br/><em>Instant Analysis</em></h1>

        {!result ? (
          <div 
            className="insight-card mt-24" 
            style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', border: '2px dashed #fcae59', background: 'transparent', cursor: 'pointer'}}
            onClick={handleUpload}
          >
            {loading ? (
              <>
                <div className="spinner" style={{marginBottom: '20px'}}></div>
                <h3 style={{color: '#fcae59'}}>Analyzing Image...</h3>
                <p style={{color: '#7d7268', marginTop: '10px', textAlign: 'center'}}>Our AI is scanning the crop for diseases and pests.</p>
              </>
            ) : (
              <>
                <div style={{background: 'rgba(252, 174, 89, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px'}}>
                  <Upload size={48} color="#fcae59" />
                </div>
                <h3 style={{color: '#dcd6ce', fontSize: '1.2rem'}}>Tap to Upload Photo</h3>
                <p style={{color: '#7d7268', marginTop: '10px', textAlign: 'center'}}>Take a clear picture of the affected leaves or stem.</p>
              </>
            )}
          </div>
        ) : (
          <div className="insight-card mt-24">
            <div className="insight-image-container pest-image-container">
              <img 
                src="https://images.unsplash.com/photo-1620959445952-b8bb6d3a95aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Detected Pest" 
                className="insight-image"
              />
              <div className="priority-tag" style={{background: '#ff7a7a', color: '#fff'}}>{result.severity} Risk</div>
            </div>

            <div className="insight-details">
              <div className="crop-title-row">
                <h2 className="crop-name">{result.identifiedPest}</h2>
                <div className="pest-icon-large">
                  <Bug size={32} color="#ff7a7a" />
                </div>
              </div>
              
              <p className="growth-stage" style={{color: '#fcae59'}}>Confidence: {result.confidence}</p>

              <div className="recommendation-box action-required" style={{borderLeftColor: '#ff7a7a'}}>
                <span className="rec-label" style={{color: '#ff7a7a'}}>RECOMMENDED TREATMENT</span>
                <p className="rec-text hindi-text">
                  {result.treatment}
                </p>
              </div>

              <div className="view-protocol" style={{color: '#ff7a7a'}} onClick={() => setResult(null)}>
                <span>SCAN ANOTHER CROP</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
      {loading && <style>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(252, 174, 89, 0.2);
          border-top-color: #fcae59;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>}
    </div>
  );
};

export default PestId;
