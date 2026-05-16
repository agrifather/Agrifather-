import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import API_BASE from '../utils/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'forgot-password' }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/verify-otp', { state: { email, purpose: 'forgot-password' } });
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
            <Mail size={32} className="fp-icon" />
          </div>
          <h1 className="fp-title">Reset Password</h1>
          <p className="fp-subtitle">Enter your registered email</p>
          <p className="fp-subtitle-hi">अपना पंजीकृत ईमेल दर्ज करें</p>
        </div>

        <form className="fp-form" onSubmit={handleSendOtp}>
          <div className="fp-form-group">
            <label className="fp-label">
              Email Address / <span className="fp-label-hi">ईमेल पता</span>
            </label>
            <input
              id="fp-email"
              className="fp-input"
              type="email"
              placeholder="e.g. kisan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
