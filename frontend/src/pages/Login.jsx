import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import API_BASE from '../utils/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [mobile, setMobile]       = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // ── OTP login state ────────────────────────────────────────────────────────
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError]   = useState('');
  const [otpDisplay, setOtpDisplay] = useState(''); // fallback OTP shown on screen

  // ── Password login ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/home');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP login ──────────────────────────────────────────────────────────────
  const handleLoginWithOtp = async () => {
    setOtpError('');
    setOtpDisplay('');
    if (!/\S+@\S+\.\S+/.test(otpEmail)) {
      setOtpError('Enter a valid email address.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, purpose: 'login' }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.otp && data.emailFailed) {
          // Email delivery failed — show OTP on screen as fallback
          setOtpDisplay(data.otp);
        } else if (data.otp) {
          // Dev/test mode — show on screen but email also sent
          setOtpDisplay(data.otp);
        }
        navigate('/verify-otp', { state: { email: otpEmail, purpose: 'login', prefillOtp: data.otp } });
      } else {
        setOtpError(data.message || 'Could not send OTP.');
      }
    } catch {
      setOtpError('Server error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        {/* Logo */}
        <div className="login-logo-section">
          <img src={logoImg} alt="AgriFather" className="login-logo-img" />
        </div>

        <div className="login-title-section">
          <h2>Welcome Back</h2>
          <p className="subtitle">Login to continue / लॉगिन करें</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group-login">
            <label>Mobile Number / मोबाइल नंबर</label>
            <div className="input-with-icon-login">
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="form-group-login">
            <label>Password / पासवर्ड</label>
            <div className="input-with-icon-login">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password? / पासवर्ड भूल गए?</Link>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary-login" disabled={loading}>
            {loading ? <span className="login-spinner" /> : 'Login / लॉगिन करें'}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        <div className="otp-login-section">
          <input
            type="email"
            className="otp-mobile-input"
            placeholder="Enter Email for OTP login / OTP के लिए ईमेल"
            value={otpEmail}
            onChange={(e) => setOtpEmail(e.target.value)}
          />
          {otpError && <p className="otp-inline-error">{otpError}</p>}
          <button
            type="button"
            className="btn-outline-login"
            onClick={handleLoginWithOtp}
            disabled={otpLoading}
          >
            {otpLoading ? 'Sending OTP...' : 'Login with OTP / OTP से लॉगिन करें'}
          </button>
        </div>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="link">Sign Up / साइन अप करें</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
