import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Search, HelpCircle, HardDrive, Key, User,
  MessageSquare, CreditCard, RefreshCw, Palette,
  Globe, Trash2, FileText, Shield, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Cookies.css';

/* ── LocalStorage Key table data ────────────────────────────────────────── */
const storageKeys = [
  {
    key: 'token',
    icon: Key,
    function: 'Saves your temporary active authentication session string (agrifather_token_ joined to your unique database user ID).',
    classification: 'Strictly Necessary',
    lifespan: 'Persists until you click "Log Out" or clear your browser data.',
    classTag: 'necessary',
  },
  {
    key: 'user',
    icon: User,
    function: 'Caches a quick text block containing your profile details: your name, mobile number, chosen crop preference, and basic profile photo link.',
    classification: 'Functional Performance',
    lifespan: 'Eliminates the need to constantly download your profile text from our servers.',
    classTag: 'functional',
  },
  {
    key: 'chatHistory',
    icon: MessageSquare,
    function: 'Stores the actual arrays of sentences exchanged between you and the AgriFather Bot during your current chat loops.',
    classification: 'Core Feature Support',
    lifespan: 'CRITICAL NOTE: Your chat history is saved locally on your device only and is NOT saved on our cloud servers.',
    classTag: 'feature',
    isCritical: true,
  },
  {
    key: 'subscriptionStatus',
    icon: CreditCard,
    function: 'Caches a quick status check (active, chosen plan type, and exact timestamp when premium features expire).',
    classification: 'Strictly Necessary',
    lifespan: 'Tells the application interface whether to display free features or unlock premium modules.',
    classTag: 'necessary',
  },
  {
    key: 'imageTokensUsed',
    icon: HardDrive,
    function: 'Maintains an active local count of how many times you have utilized the vision crop scan features during the day.',
    classification: 'Operational Metering',
    lifespan: 'Ensures compliance with daily tier thresholds and helps regulate processing workloads.',
    classTag: 'operational',
  },
  {
    key: 'lastTokenReset',
    icon: RefreshCw,
    function: 'Records a standard date timestamp marking when your daily free AI limits were last refreshed.',
    classification: 'Operational Governance',
    lifespan: 'Automatically resets your text counter every 24 hours.',
    classTag: 'operational',
  },
  {
    key: 'theme / language',
    icon: Palette,
    function: 'Remembers your user visual choices, such as light/dark mode layouts and your selected regional interface language.',
    classification: 'User Preference',
    lifespan: 'Restores your comfortable reading layout every time you open the app.',
    classTag: 'preference',
  },
];

/* ── Section cards ───────────────────────────────────────────────────────── */
const sections = [
  {
    id: 'intro',
    icon: HardDrive,
    heading: 'Introduction',
    tag: 'Overview',
    text: `This Cookie & Local Storage Policy explains how M/s AGRIFATHER utilizes client-side storage mechanisms to provide a seamless user experience within our React-driven MERN-stack application.\n\nOur platform does not deploy traditional HTTP tracking cookies or advertising cookies to build commercial profiles around your external habits. Instead, our application architecture utilizes a native browser storage module known as Web LocalStorage.\n\nEffective Date: 21st May, 2026 | Last Updated: 21st May, 2026`,
    isPositive: true,
  },
  {
    id: 'what',
    icon: HardDrive,
    num: 1,
    heading: 'What is Web LocalStorage and How Does It Function?',
    tag: 'Technical',
    text: `Unlike old-fashioned browser cookies that transfer long text strings back and forth across every network call, LocalStorage is a secure compartment inside your device's web browser. It allows our React application frontend to save temporary settings and configuration details directly on your phone or computer.\n\nThis approach saves considerable network data, reduces loading times, and prevents our systems from needing to make repetitive database queries to MongoDB.`,
  },
  {
    id: 'thirdparty',
    icon: Globe,
    num: 3,
    heading: 'Third-Party Script Operations and Gateway Cookies',
    tag: 'Third Parties',
    isCrossBorder: true,
    text: `While AgriFather keeps its application storage free from external promotional tracking scripts, our platform integrates secure tools that may deploy their own cookies over which we do not maintain direct system control:\n\n★ Razorpay Billing Scripts: When executing a paid transaction premium upgrade, Razorpay's checkout architecture loads dynamic JavaScript libraries from checkout.razorpay.com. These scripts may independently place performance cookies or local storage tags on your terminal to manage security sessions, prevent payment fraud, and complete financial handshakes safely. Razorpay's separate data and cookie policies apply directly to these interactions.\n\n★ Embedded Educational Demonstration Media: If the platform displays demonstrations or machinery overviews via embedded YouTube iframes inside our blog panels, YouTube may place its own technical cookies on your device to track video playback smoothness, regulate streaming bandwidth, and maintain view metrics.`,
  },
  {
    id: 'manage',
    icon: Trash2,
    num: 4,
    heading: 'Managing, Deleting, and Clearing Your Storage Configurations',
    tag: 'Your Control',
    isRights: true,
    text: `Data Principals hold absolute authority to manage, restrict, or wipe out local device data configurations at their own convenience:\n\n★ Manual Browser Actions: You can navigate into your browser settings panel (such as Google Chrome, Safari, or Microsoft Edge settings), look into the "Clear Browsing Data" or "Site Storage" menus, and choose to delete local storage for www.agrifather.com at any time.\n\n★ Operational Impact Warning: Wiping your LocalStorage arrays is completely safe for your device, but it will instantly log you out of the platform and require a fresh OTP verification log entry. Additionally, because conversation logs are kept exclusively inside your local client-side chatHistory array, clearing your browser data will permanently erase your past conversations with the AgriFather Bot.`,
  },
];

/* ── Tag colour map ──────────────────────────────────────────────────────── */
const tagColors = {
  'Overview':     { bg: 'rgba(45,168,74,0.1)',   text: '#2da84a' },
  'Technical':    { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6' },
  'Third Parties':{ bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b' },
  'Your Control': { bg: 'rgba(20,184,166,0.1)',  text: '#14b8a6' },
};

const classTagColors = {
  necessary:   { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444' },
  functional:  { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6' },
  feature:     { bg: 'rgba(139,92,246,0.1)',  text: '#8b5cf6' },
  operational: { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b' },
  preference:  { bg: 'rgba(45,168,74,0.1)',   text: '#2da84a' },
};

/* ── Component ───────────────────────────────────────────────────────────── */
const Cookies = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('overview'); // 'overview' | 'inventory'

  /* highlight helper */
  const hl = (text, q) => {
    if (!q.trim()) return text;
    const esc = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${esc})`, 'gi'));
    return (
      <>
        {parts.map((p, i) =>
          p.toLowerCase() === q.toLowerCase()
            ? <span key={i} className="ck-highlight">{p}</span>
            : p
        )}
      </>
    );
  };

  /* filtered sections */
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      s => s.heading.toLowerCase().includes(q) || s.text.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  /* filtered storage keys */
  const filteredKeys = useMemo(() => {
    if (!searchQuery.trim()) return storageKeys;
    const q = searchQuery.toLowerCase();
    return storageKeys.filter(
      k => k.key.toLowerCase().includes(q) ||
           k.function.toLowerCase().includes(q) ||
           k.classification.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="cookies-page">

      {/* ── Header ── */}
      <div className="ck-header">
        <button className="ck-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
          <ArrowLeft size={22} />
        </button>
        <div className="ck-header-text">
          <h2>Cookie &amp; Storage Policy</h2>
          <p>LocalStorage — No Tracking Cookies</p>
        </div>
        <div className="ck-badge">
          <Shield size={13} />
          <span>No Ads</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="ck-hero">
        <div className="ck-hero-icon">
          <HardDrive size={30} />
        </div>
        <div className="ck-hero-copy">
          <h3>Zero ad tracking. Pure local storage.</h3>
          <p>AgriFather does <strong>not</strong> use advertising cookies or third-party tracking scripts. All client-side data stays on <strong>your device</strong> using browser LocalStorage only.</p>
        </div>
      </div>

      <div className="ck-container">

        {/* ── Search ── */}
        <div className="ck-search-wrapper">
          <Search size={16} className="ck-search-icon" />
          <input
            type="text"
            className="ck-search-input"
            placeholder="Search policy or storage keys..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ck-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* ── Tabs (hidden when searching) ── */}
        {!searchQuery && (
          <div className="ck-tabs">
            <button
              className={`ck-tab ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <FileText size={15} /> Overview
            </button>
            <button
              className={`ck-tab ${activeView === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveView('inventory')}
            >
              <HardDrive size={15} /> Storage Inventory
            </button>
          </div>
        )}

        {/* ── OVERVIEW CARDS ── */}
        {(activeView === 'overview' || searchQuery) && (
          <div className="ck-cards-list">
            {searchQuery && <p className="ck-results-label">Sections matching "{searchQuery}":</p>}
            {filteredSections.length === 0 && !searchQuery && (
              <div className="ck-no-results"><HelpCircle size={34} /><p>No matching sections found.</p></div>
            )}
            {filteredSections.map(section => {
              const IconComp = section.icon;
              const tagStyle = tagColors[section.tag] || {};
              let extra = '';
              if (section.isPositive)   extra = ' ck-card--positive';
              if (section.isCrossBorder)extra = ' ck-card--warn';
              if (section.isRights)     extra = ' ck-card--rights';

              return (
                <div key={section.id} className={`ck-card${extra}`}>
                  <div className="ck-card-header">
                    <div className="ck-icon-wrap"><IconComp size={18} /></div>
                    <div className="ck-card-title-row">
                      <h4 className="ck-card-title">
                        {section.num ? `${section.num}. ` : ''}{hl(section.heading, searchQuery)}
                      </h4>
                      {section.tag && (
                        <span className="ck-tag" style={{ background: tagStyle.bg, color: tagStyle.text }}>
                          {section.tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ck-card-body">
                    {hl(section.text, searchQuery).toString().split('\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── INVENTORY TABLE / CARDS ── */}
        {(activeView === 'inventory' || searchQuery) && (
          <div className="ck-inventory">
            {searchQuery && filteredKeys.length > 0 && (
              <p className="ck-results-label" style={{ marginTop: '24px' }}>Storage keys matching "{searchQuery}":</p>
            )}
            <p className="ck-inventory-intro">
              The application programmatically sets and reads the following explicit storage parameters inside your browser:
            </p>
            <div className="ck-keys-grid">
              {filteredKeys.length === 0 ? (
                <div className="ck-no-results"><HelpCircle size={34} /><p>No matching keys found.</p></div>
              ) : (
                filteredKeys.map(k => {
                  const IconComp = k.icon;
                  const cs = classTagColors[k.classTag] || {};
                  return (
                    <div key={k.key} className={`ck-key-card${k.isCritical ? ' ck-key-card--critical' : ''}`}>
                      <div className="ck-key-top">
                        <div className="ck-key-icon-wrap">
                          <IconComp size={16} />
                        </div>
                        <code className="ck-key-name">{hl(k.key, searchQuery)}</code>
                        <span className="ck-key-tag" style={{ background: cs.bg, color: cs.text }}>
                          {k.classification}
                        </span>
                      </div>
                      {k.isCritical && (
                        <div className="ck-critical-notice">
                          <AlertTriangle size={14} />
                          <span>Chat history is local-only — clearing browser data permanently erases it.</span>
                        </div>
                      )}
                      <p className="ck-key-function">{hl(k.function, searchQuery)}</p>
                      <p className="ck-key-lifespan"><strong>Lifespan:</strong> {hl(k.lifespan, searchQuery)}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Cross-links ── */}
        <div className="ck-crosslinks">
          <p>Related legal documents:</p>
          <div className="ck-crosslink-row">
            <button className="ck-crosslink-btn" onClick={() => navigate('/privacy')}>
              <Shield size={15} /> Privacy Policy
            </button>
            <button className="ck-crosslink-btn ck-crosslink-btn--outline" onClick={() => navigate('/terms')}>
              <FileText size={15} /> Terms &amp; Conditions
            </button>
          </div>
        </div>
      </div>

      <div className="ck-footer">
        <p>© 2026 M/s AGRIFATHER — All Rights Reserved</p>
        <p>Sector 14, Dwarka, New Delhi-110078 · <a href="mailto:support@agrifather.in">support@agrifather.in</a></p>
      </div>
    </div>
  );
};

export default Cookies;
