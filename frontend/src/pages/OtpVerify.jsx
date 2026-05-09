import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import API_BASE from '../utils/api';
import './OtpVerify.css';

const OTP_LENGTH = 6;

const OtpVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // purpose: 'login' | 'forgot-password' | 'register'
  const { mobile = '', email = '', purpose = 'login' } = location.state || {};

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const focusInput = (idx) => {
    if (inputRefs.current[idx]) inputRefs.current[idx].focus();
  };

  const handleOtpChange = (value, idx) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (value && idx < OTP_LENGTH - 1) focusInput(idx + 1);
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      focusInput(idx - 1);
    }
    if (e.key === 'ArrowLeft' && idx > 0) focusInput(idx - 1);
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) focusInput(idx + 1);
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''));
      focusInput(OTP_LENGTH - 1);
      e.preventDefault();
    }
  };

  const maskedMobile = mobile
    ? `+91 ${mobile.slice(0, 2)}XXX-XXX${mobile.slice(-2)}`
    : email 
      ? email.replace(/(.{2})(.*)(?=@)/,
          (gp1, gp2, gp3) => { 
            for(let i = 0; i < gp3.length; i++) gp2+= '*'; return gp2; 
          }) 
      : '';

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, email, otp: otpCode, purpose }),
      });
      const data = await res.json();
      if (res.ok) {
        if (purpose === 'login') {
          localStorage.setItem('token', data.token || '');
          if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/home');
        } else if (purpose === 'forgot-password') {
          navigate('/home'); // redirect after password reset success
        } else {
          navigate('/home');
        }
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const endpoint = email ? `${API_BASE}/api/auth/send-otp-email` : `${API_BASE}/api/auth/send-otp`;
      const bodyPayload = email ? { email, purpose } : { mobile, purpose };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        setResendTimer(30);
        setOtp(Array(OTP_LENGTH).fill(''));
        focusInput(0);
      } else {
        const d = await res.json();
        setError(d.message || 'Could not resend OTP.');
      }
    } catch {
      setError('Server error.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-wrapper">
      <div className="otp-card">
        <button className="otp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>

        <div className="otp-header">
          <div className="otp-icon-ring">
            <ShoppingBag size={32} color="#5bb349" />
          </div>
          <h1 className="otp-title">Enter OTP</h1>
          {maskedMobile && (
            <p className="otp-subtitle">We sent a code to {maskedMobile}</p>
          )}
          <p className="otp-subtitle-hi">OTP भेजा गया है</p>
        </div>

        <form className="otp-form" onSubmit={handleVerify}>
          <div className="otp-boxes" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-box-${idx}`}
                ref={(el) => (inputRefs.current[idx] = el)}
                className={`otp-box ${digit ? 'filled' : ''} ${idx === otp.findIndex(d => d === '') ? 'active' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && <p className="otp-error">{error}</p>}

          <div className="otp-resend">
            <p className="otp-resend-label">Didn't receive code?</p>
            <button
              type="button"
              className={`otp-resend-btn ${resendTimer > 0 ? 'disabled' : ''}`}
              onClick={handleResend}
              disabled={resendTimer > 0 || resending}
            >
              {resendTimer > 0
                ? `Resend OTP / फिर से भेजें (${resendTimer}s)`
                : resending
                ? 'Sending...'
                : 'Resend OTP / फिर से भेजें'}
            </button>
          </div>

          <button
            id="otp-verify-btn"
            type="submit"
            className="otp-btn-primary"
            disabled={loading || otp.join('').length < OTP_LENGTH}
          >
            {loading ? <span className="otp-spinner" /> : <>Verify / सत्यापित करें</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerify;
