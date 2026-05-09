import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ArrowLeft } from 'lucide-react';
import API_BASE from '../utils/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, purpose: 'forgot-password' }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/verify-otp', { state: { mobile, purpose: 'forgot-password' } });
      } else {
        setError(data.message || 'Failed to send OTP. Try again.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-wrapper">
      <div className="fp-card">
        <button className="fp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>

        <div className="fp-header">
          <div className="fp-icon-ring">
            <Smartphone size={32} color="#5bb349" />
          </div>
          <h1 className="fp-title">Reset Password</h1>
          <p className="fp-subtitle">Enter your mobile number</p>
          <p className="fp-subtitle-hi">पासवर्ड रीसेट करें</p>
        </div>

        <form className="fp-form" onSubmit={handleSendOtp}>
          <div className="fp-form-group">
            <label className="fp-label">
              Mobile Number / <span className="fp-label-hi">मोबाइल नंबर</span>
            </label>
            <input
              id="fp-mobile"
              className="fp-input"
              type="tel"
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              required
            />
          </div>

          {error && <p className="fp-error">{error}</p>}

          <button
            id="fp-send-otp-btn"
            type="submit"
            className="fp-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="fp-spinner" />
            ) : (
              <>Send OTP / OTP भेजें</>
            )}
          </button>
        </form>

        <p className="fp-login-link">
          Remember it? <span onClick={() => navigate('/login')} className="fp-link">Login / लॉगिन करें</span>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
