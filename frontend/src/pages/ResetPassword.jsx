import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import API_BASE from '../utils/api';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email = '', otp = '' } = location.state || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if no email/otp found in state
  if (!email || !otp) {
    navigate('/forgot-password');
    return null;
  }

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rp-wrapper">
        <div className="rp-card success-view">
          <div className="rp-success-icon">
            <CheckCircle2 size={64} color="var(--primary-color)" />
          </div>
          <h1 className="rp-title">Success!</h1>
          <p className="rp-subtitle">Your password has been reset successfully.</p>
          <p className="rp-subtitle-hi">आपका पासवर्ड सफलतापूर्वक बदल दिया गया है।</p>
          <button className="rp-btn-primary" onClick={() => navigate('/login')}>
            Go to Login / लॉगिन करें
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-wrapper">
      <div className="rp-card">
        <button className="rp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>

        <div className="rp-header">
          <div className="rp-icon-ring">
            <Lock size={32} className="rp-icon" />
          </div>
          <h1 className="rp-title">New Password</h1>
          <p className="rp-subtitle">Set your new account password</p>
          <p className="rp-subtitle-hi">नया पासवर्ड सेट करें</p>
        </div>

        <form className="rp-form" onSubmit={handleReset}>
          <div className="rp-form-group">
            <label className="rp-label">
              New Password / <span className="rp-label-hi">नया पासवर्ड</span>
            </label>
            <input
              className="rp-input"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="rp-form-group">
            <label className="rp-label">
              Confirm Password / <span className="rp-label-hi">पासवर्ड की पुष्टि करें</span>
            </label>
            <input
              className="rp-input"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="rp-error">{error}</p>}

          <button
            type="submit"
            className="rp-btn-primary"
            disabled={loading}
          >
            {loading ? <span className="rp-spinner" /> : <>Reset Password / पासवर्ड बदलें</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
