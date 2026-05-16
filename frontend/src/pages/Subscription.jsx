import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Crown, Loader, Shield, Sparkles } from 'lucide-react';
import { getSubscriptionStatus } from '../utils/imageTokens';
import API_BASE from '../utils/api';
import './Subscription.css';

const PLANS = {
  free: {
    label: 'STARTER',
    name: 'Free',
    price: 'Free',
    period: '',
    features: [
      { text: 'Unlimited messages', included: true },
      { text: 'Basic crop advisory', included: true },
      { text: 'Hindi & English support', included: true },
      { text: 'Weather updates', included: true },
      { text: 'Market prices', included: true },
      { text: 'No voice mode', included: false },
      { text: 'No image upload', included: false },
      { text: 'Limited history', included: false },
    ],
  },
  monthly: {
    label: 'PRO',
    name: 'Pro Monthly',
    price: 399,
    period: '/month',
    planId: 'pro_monthly',
    features: [
      { text: 'Unlimited messages', included: true },
      { text: 'Voice input & output', included: true },
      { text: 'Image-based disease detection', included: true },
      { text: 'All 10 regional languages', included: true },
      { text: 'Smart farming reminders', included: true },
      { text: 'Complete chat history', included: true },
      { text: 'Priority AI responses', included: true },
      { text: 'Emergency alerts', included: true },
      { text: 'Geolocation-based advice', included: true },
      { text: 'Government scheme guidance', included: true },
    ],
  },
  yearly: {
    label: 'PRO',
    name: 'Pro Yearly',
    price: 4199,
    originalPrice: 4788,
    period: '/year',
    planId: 'pro_yearly',
    savings: '₹1,589 saved',
    features: [
      { text: 'Everything in Pro Monthly', included: true },
      { text: 'Save ₹1589 vs monthly', included: true },
      { text: 'Seasonal crop planner', included: true },
      { text: 'Export farming diary', included: true },
      { text: 'Advanced market analytics', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Dedicated support', included: true },
    ],
  },
};

const Subscription = () => {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const status = getSubscriptionStatus();
    if (status.active) {
      setSubscription(status);
    }
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planKey) => {
    if (planKey === 'free') {
      navigate(-1);
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first to upgrade your plan.');
      navigate('/login');
      return;
    }

    const plan = PLANS[planKey];
    setLoadingPlan(planKey);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Payment gateway failed to load. Please check your internet connection.');
        setLoadingPlan(null);
        return;
      }

      // Create order on backend
      const res = await fetch(`${API_BASE}/api/subscription/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan.planId }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          alert('Your session has expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          alert(data.message || 'Failed to create order. Please try again.');
        }
        setLoadingPlan(null);
        return;
      }

      // Get user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Open Razorpay checkout
      const options = {
        key: data.razorpayKeyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'AgriFather Pro',
        description: `${plan.name} Subscription`,
        order_id: data.order.id,
        handler: async function (response) {
          // Verify payment on backend
          try {
            const verifyRes = await fetch(`${API_BASE}/api/subscription/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.planId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              // Store subscription in localStorage
              const subData = {
                active: true,
                plan: plan.planId,
                planName: plan.name,
                expiresAt: verifyData.expiresAt,
                paymentId: response.razorpay_payment_id,
                subscribedAt: Date.now(),
              };
              localStorage.setItem('af_subscription', JSON.stringify(subData));
              setSubscription(subData);
              alert('🎉 Payment successful! You now have unlimited access.');
            } else {
              alert(verifyData.message || 'Payment verification failed. Contact support.');
            }
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
          setLoadingPlan(null);
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          },
        },
        prefill: {
          name: user.name || '',
          contact: user.mobile || '',
        },
        theme: {
          color: '#22c55e',
        },
        notes: {
          plan: plan.planId,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setLoadingPlan(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Something went wrong. Please try again.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="subscription-page">
      {/* Back button */}
      <button className="sub-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
      </button>

      {/* Hero */}
      <div className="sub-hero">
        <div className="sub-badge">
          <Sparkles size={14} />
          India's Most Advanced AI for Farmers
        </div>
        <h1>
          Upgrade to<br />
          <span>AGRIFATHER Pro</span>
        </h1>
        <p className="sub-hero-desc">
          Get unlimited AI farming advice, voice support, disease detection, and more.
        </p>
        <p className="sub-hero-hindi hindi-text">
          असीमित कृषि सहायता के लिए अपग्रेड करें 🌾
        </p>
      </div>

      {/* Active subscription banner */}
      {subscription?.active && (
        <div className="sub-active-banner">
          <div className="sub-active-badge">
            <Crown size={14} /> Active Subscription
          </div>
          <h3>You're on {subscription.planName || 'Pro'} Plan</h3>
          <p>
            Expires: {subscription.expiresAt
              ? new Date(subscription.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'N/A'}
          </p>
        </div>
      )}

      {/* Plan Cards */}
      <div className="sub-plans">

        {/* ── Free Plan ── */}
        <div className="sub-plan-card sub-plan-free">
          <div className="sub-plan-inner">
            <p className="sub-plan-label">{PLANS.free.label}</p>
            <h2 className="sub-plan-name">Free</h2>
            <div className="sub-price-row">
              <span className="sub-price-amount">Free</span>
            </div>
            <ul className="sub-features">
              {PLANS.free.features.map((f, i) => (
                <li key={i} className={`sub-feature-item ${!f.included ? 'disabled' : ''}`}>
                  <span className={`sub-feature-icon ${f.included ? 'check' : 'cross'}`}>
                    {f.included ? <Check size={12} /> : <X size={12} />}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="sub-cta-wrapper">
            <button className="sub-cta-btn sub-cta-free" onClick={() => handlePayment('free')}>
              Continue Free
            </button>
          </div>
        </div>

        <div className="sub-divider">
          <div className="sub-divider-line" />
          <span className="sub-divider-text">Upgrade</span>
          <div className="sub-divider-line" />
        </div>

        {/* ── Pro Monthly ── */}
        <div className="sub-plan-card sub-plan-monthly">
          <div className="sub-plan-inner">
            <p className="sub-plan-label">{PLANS.monthly.label}</p>
            <h2 className="sub-plan-name">{PLANS.monthly.name}</h2>
            <div className="sub-price-row">
              <span className="sub-price-symbol">₹</span>
              <span className="sub-price-amount">{PLANS.monthly.price}</span>
              <span className="sub-price-period">{PLANS.monthly.period}</span>
            </div>
            <ul className="sub-features">
              {PLANS.monthly.features.map((f, i) => (
                <li key={i} className="sub-feature-item">
                  <span className="sub-feature-icon check">
                    <Check size={12} />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="sub-cta-wrapper">
            <button
              className="sub-cta-btn sub-cta-pro"
              onClick={() => handlePayment('monthly')}
              disabled={loadingPlan === 'monthly' || subscription?.active}
            >
              {loadingPlan === 'monthly' ? (
                <>
                  <Loader size={18} className="spin-icon" /> Processing…
                </>
              ) : subscription?.active ? (
                '✓ Subscribed'
              ) : (
                <>
                  <Crown size={16} /> Upgrade Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Pro Yearly ── */}
        <div className="sub-plan-card sub-plan-yearly">
          <div className="sub-popular-badge">BEST VALUE</div>
          <div className="sub-plan-inner">
            <p className="sub-plan-label">{PLANS.yearly.label}</p>
            <h2 className="sub-plan-name">{PLANS.yearly.name}</h2>
            <div className="sub-price-row">
              <span className="sub-price-symbol">₹</span>
              <span className="sub-price-amount">{PLANS.yearly.price}</span>
              <span className="sub-price-original">₹{PLANS.yearly.originalPrice}</span>
              <span className="sub-price-period">{PLANS.yearly.period}</span>
            </div>
            <div className="sub-savings-badge">
              💰 {PLANS.yearly.savings}
            </div>
            <ul className="sub-features">
              {PLANS.yearly.features.map((f, i) => (
                <li key={i} className="sub-feature-item">
                  <span className="sub-feature-icon check">
                    <Check size={12} />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="sub-cta-wrapper">
            <button
              className="sub-cta-btn sub-cta-yearly"
              onClick={() => handlePayment('yearly')}
              disabled={loadingPlan === 'yearly' || subscription?.active}
            >
              {loadingPlan === 'yearly' ? (
                <>
                  <Loader size={18} className="spin-icon" /> Processing…
                </>
              ) : subscription?.active ? (
                '✓ Subscribed'
              ) : (
                <>
                  <Crown size={16} /> Upgrade Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security badge */}
      <div className="sub-secure">
        <Shield size={14} />
        Payments secured by Razorpay
      </div>

      {/* Footer */}
      <div className="sub-footer">
        <p>Cancel anytime. No hidden charges.</p>
        <p>कभी भी रद्द करें। कोई छिपा शुल्क नहीं।</p>
      </div>
    </div>
  );
};

export default Subscription;
