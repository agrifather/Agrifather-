import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit, MapPin, Leaf, Image, Crown, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { getRemainingTokens, getMaxTokens, getResetCountdown, getSubscriptionStatus, hasUnlimitedAccess, getRemainingChats, getMaxChats, getChatResetCountdown } from '../utils/imageTokens';
import { getUserItem, setUserItem } from '../utils/userStorage';
import API_BASE from '../utils/api';
import '../pages/Subscription.css';
import './Profile.css';



// ── Small reusable toggle button ─────────────────────────────────────────────
const CycleButton = ({ options, value, onChange }) => {
  const idx = options.indexOf(value);
  const next = () => onChange(options[(idx + 1) % options.length]);
  return (
    <button className="cycle-btn" onClick={next}>
      {value}
    </button>
  );
};

// ── On/Off toggle switch ──────────────────────────────────────────────────────
const ToggleSwitch = ({ on, onChange }) => (
  <div className={`toggle-switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
    <div className="toggle-knob" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

// ── Image compression utility ────────────────────────────────────────────────
// Profile pics are compressed hard (300×300, 0.45 quality) so the base64
// string stored in MongoDB stays tiny (~15–25 KB) → fast saves, no hangs.
const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.45) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio within 300×300 box
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name || 'profile.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas compression returned null blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const Profile = () => {
  const navigate = useNavigate();
  const { lang, setLang, langLabel } = useLanguage();
  // ── Load user from localStorage ───────────────────────────────────────────
  const [localUser, setLocalUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; }
    catch { return {}; }
  });

  const token = localStorage.getItem('token') || '';

  // ── Profile state ─────────────────────────────────────────────────────────
  const [name, setName] = useState(localUser.name || '');
  const [location, setLocation] = useState(getUserItem('af_location', 'Vidarbha, Maharashtra'));

  // ── Fetch User Profile on Mount ─────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const { user } = await res.json();
          // Profile pic is no longer updated
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  // ── Crops & Farm ──────────────────────────────────────────────────────────
  const [crops, setCrops] = useState(() => {
    try { return JSON.parse(getUserItem('af_crops')) || [localUser.crop || 'Wheat']; }
    catch { return [localUser.crop || 'Wheat']; }
  });
  const [landArea, setLandArea] = useState(getUserItem('af_landArea', '5.2 acres'));
  const [soilType, setSoilType] = useState(getUserItem('af_soilType', 'Clay Loam'));

  // ── Settings ──────────────────────────────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState(() => getUserItem('af_voiceMode') !== 'false');
  const [notifications, setNotifications] = useState(() => getUserItem('af_notifications') !== 'false');
  const [responseStyle, setResponseStyle] = useState(() => getUserItem('af_responseStyle') || 'Detailed');

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [modalType, setModalType] = useState(null); // 'profile' | 'crops' | 'farm'
  const [tempInput, setTempInput] = useState('');
  const [tempInput2, setTempInput2] = useState('');
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [toast, setToast] = useState('');   // ← global in-page toast

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Image Token state ─────────────────────────────────────────────────────
  const [tokensLeft] = useState(() => getRemainingTokens());
  const maxTokens = getMaxTokens();
  const isPro = hasUnlimitedAccess();
  const tokenPct = isPro ? 100 : Math.round((tokensLeft / maxTokens) * 100);
  const resetIn = (!isPro && tokensLeft < maxTokens) ? getResetCountdown() : null;
  const subStatus = getSubscriptionStatus();

  // ── Chat Token state ──────────────────────────────────────────────────────
  const chatsLeft = getRemainingChats();
  const maxChats = getMaxChats();
  const chatPct = isPro ? 100 : Math.round((chatsLeft / maxChats) * 100);
  const chatResetIn = (!isPro && chatsLeft < maxChats) ? getChatResetCountdown() : null;

  // Persist settings to localStorage
  useEffect(() => { setUserItem('af_voiceMode', voiceMode); }, [voiceMode]);
  useEffect(() => { setUserItem('af_notifications', notifications); }, [notifications]);
  useEffect(() => { setUserItem('af_responseStyle', responseStyle); }, [responseStyle]);

  const farmerId = `AG-${(localUser.mobile || '00000').slice(-5).padStart(5, '0')}`;
  // Avatar doesn't need click handlers anymore
  const getInitial = (n) => n ? n.charAt(0).toUpperCase() : '?';

  // ── Save name ─────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      if (modalType === 'profile') {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('location', location);
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) {
          const { user } = await res.json();
          const updated = { ...localUser, name: user.name };
          setLocalUser(updated);

          const userToSave = { ...updated };
          delete userToSave.profilePic;
          localStorage.setItem('user', JSON.stringify(userToSave));

          setUserItem('af_location', location);
          setSaveMsg('Saved!');
          setTimeout(() => setSaveMsg(''), 2000);
        }
      } else if (modalType === 'crops') {
        const newCrops = tempInput.split(',').map(c => c.trim()).filter(c => c);
        setCrops(newCrops);
        setUserItem('af_crops', JSON.stringify(newCrops));
      } else if (modalType === 'farm') {
        setLandArea(tempInput);
        setSoilType(tempInput2);
        setUserItem('af_landArea', tempInput);
        setUserItem('af_soilType', tempInput2);
      }
    } finally {
      setSaving(false);
      setModalType(null);
    }
  };

  const getCropEmoji = (crop) => {
    const c = crop.toLowerCase();
    if (c.includes('wheat') || c.includes('rice')) return '🌾';
    if (c.includes('maize') || c.includes('corn')) return '🌽';
    if (c.includes('potato')) return '🥔';
    if (c.includes('cotton')) return '☁️';
    return '🌱';
  };

  return (
    <div className="profile-page-container">
      {/* ── Global Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,20,0.92)', backdropFilter: 'blur(10px)',
          color: '#fff', padding: '12px 22px', borderRadius: 12,
          fontSize: '0.9rem', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          maxWidth: '90vw', textAlign: 'center',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast}
        </div>
      )}
      {/* HEADER */}
      <div className="profile-header">
        <div className="profile-header-left">
          <ArrowLeft size={24} className="back-icon" onClick={() => navigate(-1)} />
          <h2 className="header-title hindi-text">Profile / प्रोफ़ाइल</h2>
        </div>
      </div>

      <div className="profile-content pb-32">

        {/* USER NAME INITIAL & NAME (Replaces Profile Section) */}
        <div className="user-initial-header">
          <div className="avatar-circle">
            {getInitial(name)}
          </div>
          <div className="user-header-details">
            <h2 className="profile-name hindi-text">{name || 'किसान जी'}</h2>
            <p className="profile-name-en">{name || 'Kisan Ji'}</p>
          </div>
        </div>

        {/* MY CROPS */}
        <div className="profile-section">
          <h3 className="section-heading hindi-text">My Crops / मेरी फसलें</h3>
          <div className="crops-list">
            {crops.length > 0
              ? crops.map((crop, i) => (
                <div key={i} className="crop-chip">
                  {getCropEmoji(crop)} {crop}
                </div>
              ))
              : <p style={{ color: 'var(--text-muted)' }}>No crops added.</p>
            }
          </div>
          <button className="add-crop-btn" onClick={() => {
            setTempInput(crops.join(', '));
            setModalType('crops');
          }}>
            + Add or Edit Crops
          </button>
        </div>

        {/* FARM DETAILS */}
        <div className="profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-heading hindi-text" style={{ margin: 0 }}>Farm Details / खेत का विवरण</h3>
            <button className="add-crop-btn" onClick={() => {
              setTempInput(landArea);
              setTempInput2(soilType);
              setModalType('farm');
            }}><Edit size={16} /></button>
          </div>
          <div className="farm-details-list">
            <div className="farm-detail-item">
              <div className="detail-icon-wrap"><MapPin size={18} color="#2da84a" /></div>
              <div className="detail-text">
                <p className="detail-label hindi-text">भूमि क्षेत्र</p>
                <p className="detail-value">Land Area</p>
              </div>
              <div className="detail-right-val">{landArea}</div>
            </div>
            <div className="farm-detail-item">
              <div className="detail-icon-wrap"><Leaf size={18} color="#2da84a" /></div>
              <div className="detail-text">
                <p className="detail-label hindi-text">मिट्टी का प्रकार</p>
                <p className="detail-value">Soil Type</p>
              </div>
              <div className="detail-right-val">{soilType}</div>
            </div>
          </div>
        </div>

        {/* USAGE QUOTAS */}
        <div className="profile-section">
          <h3 className="section-heading hindi-text">Usage Quotas / उपयोग सीमा</h3>

          {/* Chat Messages */}
          <div className="token-card" style={{ marginBottom: 12 }}>
            <div className="token-header">
              <div className="token-icon-wrap">💬</div>
              <div className="token-info">
                <p className="token-title">Daily Messages</p>
                <p className="token-sub hindi-text">प्रति दिन संदेश</p>
              </div>
              <div className={`token-count ${!isPro && chatsLeft === 0 ? 'token-zero' : ''}`}>
                {isPro ? '∞' : `${chatsLeft}/${maxChats}`}
              </div>
            </div>
            <div className="token-bar-bg">
              <div
                className="token-bar-fill"
                style={{ width: `${chatPct}%`, background: isPro ? '#2da84a' : chatsLeft === 0 ? '#ef4444' : chatsLeft <= 3 ? '#f59e0b' : '#2da84a' }}
              />
            </div>
            <p className="token-desc">
              {isPro
                ? '✅ Unlimited messages with Pro plan.'
                : chatsLeft === 0
                  ? `🚫 All messages used. Resets in ${getChatResetCountdown()}.`
                  : chatsLeft <= 3
                    ? `⚠️ ${chatsLeft} message${chatsLeft === 1 ? '' : 's'} remaining — resets in ${chatResetIn}.`
                    : `✅ ${chatsLeft} message${chatsLeft === 1 ? '' : 's'} remaining today.`
              }
            </p>
          </div>

          {/* Image Scans */}
          <div className="token-card">
            <div className="token-header">
              <div className="token-icon-wrap"><Image size={20} color="#2da84a" /></div>
              <div className="token-info">
                <p className="token-title">Daily Image Scans</p>
                <p className="token-sub hindi-text">प्रति 48 घंटे में छवि स्कैन</p>
              </div>
              <div className={`token-count ${tokensLeft === 0 ? 'token-zero' : ''}`}>
                {tokensLeft}/{maxTokens}
              </div>
            </div>
            <div className="token-bar-bg">
              <div
                className="token-bar-fill"
                style={{ width: `${tokenPct}%`, background: tokensLeft === 0 ? '#ef4444' : tokensLeft <= 2 ? '#f59e0b' : '#2da84a' }}
              />
            </div>
            <p className="token-desc">
              {tokensLeft === 0
                ? `🚫 All scans used. Resets in ${getResetCountdown()}.`
                : tokensLeft <= 2
                  ? `⚠️ ${tokensLeft} scan${tokensLeft === 1 ? '' : 's'} remaining — resets in ${resetIn}.`
                  : `✅ ${tokensLeft} image scan${tokensLeft === 1 ? '' : 's'} remaining in this 48-hour window.`
              }
            </p>
          </div>
        </div>

        {/* SUBSCRIPTION */}
        <div className="profile-section">
          <h3 className="section-heading hindi-text">Subscription / सदस्यता</h3>
          <div className="profile-sub-card">
            <div className="profile-sub-header">
              <div className="profile-sub-icon">
                <Crown size={20} />
              </div>
              <div className="profile-sub-info">
                <p className="sub-title">{subStatus.active ? (subStatus.planName || 'Pro Plan') : 'Free Plan'}</p>
                <p className="sub-desc">{subStatus.active ? 'Unlimited scans & messages' : '5 scans per 48 hours'}</p>
              </div>
              <span className={`profile-sub-status ${subStatus.active ? 'active' : 'free'}`}>
                {subStatus.active ? 'Active' : 'Free'}
              </span>
            </div>
            {subStatus.active && subStatus.expiresAt && (
              <p className="profile-sub-expiry">
                Expires: {new Date(subStatus.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <button
              className={`profile-upgrade-btn ${subStatus.active ? 'subscribed' : ''}`}
              onClick={() => navigate('/subscription')}
            >
              <Crown size={16} />
              {subStatus.active ? 'Manage Subscription' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        {/* SETTINGS */}
        <div className="profile-section mb-20">
          <h3 className="section-heading hindi-text">Settings / सेटिंग्स</h3>
          <div className="settings-list">

            {/* Language — cycle button: Hindi → English → Marathi */}
            <div className="setting-card-unified">
              <div className="setting-unified-text">
                <p className="setting-unified-label">Language</p>
                <p className="setting-unified-sub hindi-text">भाषा</p>
              </div>
              <CycleButton
                options={['Hindi', 'English', 'Marathi']}
                value={langLabel}
                onChange={(val) => setLang(val)}
              />
            </div>

            {/* Voice Mode — Coming Soon */}
            <div className="setting-card-unified">
              <div className="setting-unified-text">
                <p className="setting-unified-label">Voice Mode</p>
                <p className="setting-unified-sub hindi-text">आवाज मोड</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.75rem', background: 'linear-gradient(90deg,#f59e0b,#ef4444)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontWeight: 700, letterSpacing: 0.3 }}>Soon</span>
                <ToggleSwitch
                  on={voiceMode}
                  onChange={(val) => {
                    if (val) {
                      showToast('🎙️ Voice Mode is coming soon! Stay tuned. / जल्द आने वाला है!');
                    } else {
                      setVoiceMode(false);
                    }
                  }}
                />
              </div>
            </div>

            {/* Response Style — cycle button: Detailed → Brief → Expert */}
            <div className="setting-card-unified">
              <div className="setting-unified-text">
                <p className="setting-unified-label">Response Style</p>
                <p className="setting-unified-sub hindi-text">प्रतिक्रिया शैली</p>
              </div>
              <CycleButton
                options={['Detailed', 'Brief', 'Expert']}
                value={responseStyle}
                onChange={setResponseStyle}
              />
            </div>

            {/* Notifications — toggle On/Off */}
            <div className="setting-card-unified">
              <div className="setting-unified-text">
                <p className="setting-unified-label">Notifications</p>
                <p className="setting-unified-sub hindi-text">सूचनाएं</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="toggle-label">{notifications ? 'Enabled' : 'Disabled'}</span>
                <ToggleSwitch on={notifications} onChange={setNotifications} />
              </div>
            </div>

            <button
              className="unified-logout-btn"
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/login');
              }}
            >
              Logout / लॉगआउट करें
            </button>

            <button
              className="unified-logout-btn"
              style={{ background: '#ef4444', color: '#fff', marginTop: 12, border: 'none' }}
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
                if (!confirmed) return;
                try {
                  const res = await fetch(`${API_BASE}/api/auth/profile`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    alert('Account deleted successfully.');
                    navigate('/register');
                  } else {
                    alert('Failed to delete account. Please try again.');
                  }
                } catch (err) {
                  alert('Server error occurred.');
                }
              }}
            >
              Delete Account / खाता हटाएं
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* MODALS */}
      {modalType && (
        <div className="settings-modal-overlay" onClick={() => setModalType(null)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>
              {modalType === 'profile' ? 'Edit Profile' : modalType === 'crops' ? 'Edit Crops' : 'Edit Farm Details'}
            </h3>

            {modalType === 'profile' && (
              <>
                <label className="modal-label">Full Name / पूरा नाम</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  className="modal-input"
                />
                <label className="modal-label">Location / स्थान</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Nagpur, Maharashtra"
                  className="modal-input"
                />
              </>
            )}

            {modalType === 'crops' && (
              <>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Enter crops separated by commas
                </p>
                <input
                  type="text"
                  value={tempInput}
                  onChange={e => setTempInput(e.target.value)}
                  placeholder="Wheat, Rice, Cotton..."
                  className="modal-input"
                />
              </>
            )}

            {modalType === 'farm' && (
              <>
                <label className="modal-label">Land Area / भूमि क्षेत्र</label>
                <input
                  type="text"
                  value={tempInput}
                  onChange={e => setTempInput(e.target.value)}
                  placeholder="5 acres"
                  className="modal-input"
                />
                <label className="modal-label">Soil Type / मिट्टी का प्रकार</label>
                <input
                  type="text"
                  value={tempInput2}
                  onChange={e => setTempInput2(e.target.value)}
                  placeholder="Clay Loam"
                  className="modal-input"
                />
              </>
            )}

            {saveMsg && <p style={{ color: '#2da84a', marginBottom: 8 }}>{saveMsg}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="modal-cancel-btn" onClick={() => setModalType(null)}>Cancel</button>
              <button className="modal-save-btn" onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
