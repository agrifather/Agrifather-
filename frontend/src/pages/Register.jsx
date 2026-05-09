import React, { useState } from 'react';
import { User, Phone, Mail, Tractor, ChevronDown, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import API_BASE from '../utils/api';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName]       = useState('');
  const [mobile, setMobile]   = useState('');
  const [email, setEmail]     = useState('');
  const [crop, setCrop]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]         = useState('');
  
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSendOtp = async () => {
    setError('');
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        alert('OTP sent to your email! (Check backend console)');
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!otp) {
      setError('OTP is required to register.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, email, crop, password, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        // Auto-login after register
        localStorage.setItem('token', 'agrifather_token_' + data.user?._id);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/home');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">

        {/* Logo */}
        <div className="register-logo-section">
          <img src={logoImg} alt="AgriFather" className="register-logo-img" />
        </div>

        <div className="register-header">
          <h1 className="title">Create Account</h1>
          <p className="subtitle">Join AgriFather — Your AI Farming Partner</p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>

          {/* Full Name */}
          <div className="form-group">
            <label>Full Name / पूरा नाम</label>
            <div className="input-with-icon">
              <User size={20} className="input-icon" />
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="form-group">
            <label>Mobile Number / मोबाइल नंबर</label>
            <div className="input-with-icon">
              <Phone size={20} className="input-icon" />
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email Address / ईमेल</label>
            <div className="input-with-icon">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={otpSent}
              />
            </div>
          </div>
          
          {/* OTP Section */}
          {!otpSent ? (
            <button
              type="button"
              className="btn-outline-login mb-4"
              onClick={handleSendOtp}
              disabled={otpLoading || !email}
              style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '12px', border: '1px solid #5bb349', color: '#5bb349', background: 'transparent' }}
            >
              {otpLoading ? 'Sending...' : 'Send OTP to Email / ईमेल पर OTP भेजें'}
            </button>
          ) : (
            <div className="form-group">
              <label>Enter OTP / OTP दर्ज करें</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder="Enter OTP from email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label>Password / पासवर्ड</label>
            <div className="input-with-icon">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '16px' }}
              />
              <button
                type="button"
                className="reg-pwd-toggle"
                onClick={() => setShowPwd(v => !v)}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Crop */}
          <div className="form-group">
            <label>Primary Crop / मुख्य फसल</label>
            <div className="input-with-icon select-wrapper">
              <Tractor size={20} className="input-icon" />
              <select value={crop} onChange={(e) => setCrop(e.target.value)} required>
                <option value="" disabled>Select your crop</option>
                <option value="wheat">Wheat (Rabi)</option>
                <option value="rice">Rice (Kharif)</option>
                <option value="cotton">Cotton</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="soybean">Soybean</option>
                <option value="maize">Maize</option>
                <option value="groundnut">Groundnut</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown size={20} className="select-icon" />
            </div>
          </div>

          {/* Age Verification & Terms */}
          <div className="terms-group" style={{ marginBottom: '8px' }}>
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              <span className="terms-text">
                I confirm that I am 18 years of age or older / मैं पुष्टि करता हूँ कि मेरी आयु १८ वर्ष या उससे अधिक है
              </span>
            </label>
          </div>

          <div className="terms-group">
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              <span className="terms-text">
                I agree to the <Link to="/register">Terms</Link> &amp; <Link to="/register">Privacy Policy</Link>
              </span>
            </label>
          </div>

          {error && <p className="reg-error">{error}</p>}

          <button type="submit" className="btn-primary mt-4" disabled={loading}>
            {loading
              ? <span className="reg-spinner" />
              : <><ArrowRight size={18} /> Create Account</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="link">Login / लॉगिन करें</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
