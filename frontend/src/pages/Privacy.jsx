import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Search, HelpCircle, Shield, Database,
  Eye, Users, Lock, Globe, Trash2, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Privacy.css';

const privacySections = [
  {
    id: 'intro',
    icon: Shield,
    heading: 'Introduction & Data Fiduciary Identity',
    text: `M/s AGRIFATHER values your individual digital privacy and recognizes the importance of securing your personal details. This Privacy Policy is structured specifically to address the statutory processing demands of the Digital Personal Data Protection (DPDP) Act, 2023.\n\nFor the operational layout of this policy, AgriFather functions as a "Data Fiduciary" who determines the purpose and technical means of data processing, while You act as the "Data Principal" possessing absolute rights of access, correction, consent withdrawal, and deletion over your personal information.\n\nThis document maps out how we collect, store, transmit, process, and delete your personal information within our React/Node.js application stack.\n\nEffective Date: 21st May, 2026 | Last Updated: 21st May, 2026`,
    tag: 'Compliance',
  },
  {
    id: 'collected',
    num: 1,
    icon: Database,
    heading: 'Categories of Personal Data Collected Directly From You',
    text: `We collect only the baseline identifiers required to deliver specialized agricultural technology services and authenticate your system routes:\n\n★ Identity Data: Your full legal name provided during manual registration.\n★ Contact Data: Your ten-digit active Indian mobile number and functional email address. The mobile number serves as your primary system identity credential and is checked via secure One-Time Password (OTP) processing arrays.\n★ Profiling and Agricultural Preferences: Your primary crop selection parameters (e.g., Wheat, Rice, Cotton, Soybean) cached to customize and filter the AI chatbot's instructional responses.\n★ Visual Data: Optional profile images uploaded directly into your application configuration panel. Images are handled natively within our MongoDB schemas.\n★ Financial Transaction History: Safe records of your payment plans, Razorpay payment identifiers, transaction currency quantities, and plan activation or expiration timestamps. The app does not save raw credit card numbers or secret authentication pins on its local servers.`,
    tag: 'Data Collection',
  },
  {
    id: 'images',
    num: 2,
    icon: Eye,
    heading: 'Transient Image Data Handling (Crop and Disease Scanning)',
    text: `When you utilize the computerized Crop & Disease Scan feature, you upload an image of your damaged leaves, soil conditions, or crop anomalies up to a file limit of 10MB. Mechanically, these image files are held dynamically in volatile server memory (Multer.memoryStorage). They are converted into temporary base64 data structures and passed over a secure connection directly to the OpenRouter Vision API (specifically executing the Nvidia Nemotron-Nano visual processing framework) for real-time model analysis.\n\nAgriFather does not store, cache, or maintain your farm photographs permanently on its server storage architectures. Once the computer vision AI completes its diagnosis and returns the text results to your interface screen, the memory array is automatically flushed and destroyed.`,
    tag: 'Image Privacy',
    isPositive: true,
  },
  {
    id: 'purpose',
    num: 3,
    icon: FileText,
    heading: 'Purpose of Processing and Lawful Basis',
    text: `Your personal data is handled exclusively for specified, lawful purposes:\n\n★ Contractual Execution: Setting up your account, validating your access tokens, processing your premium payments, and delivering active access to premium modules.\n★ AI Personalization: Formatting background system prompts to ensure the underlying LLM models interpret your queries tailored to your declared regional crops and selected interface language.\n★ Security Verification: Preventing botting attacks, tracking software injection attempts, and eliminating fraudulent access to our primary admin dashboard panel.\n\nUnder Section 4 of the DPDP Act, 2023, the processing is legally grounded on your Explicit Consent provided voluntarily when checking the platform registration checkboxes, and on the performance of a valid digital contract.`,
    tag: 'Legal Basis',
  },
  {
    id: 'thirdparty',
    num: 4,
    icon: Globe,
    heading: 'Third-Party Data Processors and Service Aggregators',
    text: `To execute our core platform tasks, we transmit specific sets of data to verified third-party technical entities acting as "Data Processors" under our direction:\n\n★ OpenRouter.ai: Receives your text-based input queries and base64 transient crop images over automated secure bridges. OpenRouter routes these arrays to free-tier and premium LLM clusters (Nvidia, Meta Llama, Google Gemma, Mistral, DeepSeek) to compile real-time agronomic answers.\n★ Razorpay Software Private Limited: Acts as our secure external payment transaction gateway. They manage the entire checkout interface page and possess standalone compliance configurations to handle financial billing categories under RBI mandates.\n\nCROSS-BORDER DATA FLOWS: While your primary user identity files are kept on secure database infrastructure deployed in alignment with regional hosting constraints, you explicitly acknowledge and agree that text queries and crop image vectors passed to OpenRouter.ai may be processed outside the geographic boundaries of the Republic of India. This depends entirely on where the respective open-source AI model weight configurations are active.`,
    tag: 'Third Parties',
    isCrossBorder: true,
  },
  {
    id: 'retention',
    num: 5,
    icon: Lock,
    heading: 'Data Retention, Security Controls, and Production Security Note',
    text: `The platform maintains your identity record and preferences only for the duration required to satisfy its core operational workflows or fulfill legal tax accounting demands:\n\n★ Account registration records and crop preferences are kept until the Data Principal explicitly initiates a formal profile deletion request.\n★ Commercial subscription transaction logs are held for the legally required duration mandated under Indian corporate and tax audit regulations.\n\nSECURITY ARCHITECTURE NOTE: Our current staging frameworks implement password controls, secure JWT routing tokens, transport security rules (HTTPS), and enforce bcrypt-based cryptographic hashing to prevent unauthorized storage access. Data Principals are explicitly reminded that no digital system transmitting variables over public routing grids can claim absolute immunity from zero-day exploits. We make security upgrades a continuous baseline process.`,
    tag: 'Security',
  },
  {
    id: 'rights',
    num: 6,
    icon: Users,
    heading: 'Statutory Rights of the Data Principal',
    text: `Under the comprehensive chapters of the DPDP Act, 2023, you possess the following actionable rights which you may trigger through written communication with our team:\n\n★ Right to Access: The right to receive a concise summary of your personal data currently being processed by our system.\n★ Right to Correction and Erasure: The right to correct erroneous mobile numbers, change misspelled names, or request the permanent destruction of your entire user account record via an automated account purge.\n★ Right to Withdrawal of Consent: The right to retract your processing consent at any time. Upon receiving a consent withdrawal notice, we will terminate your account profile and delete your personal records within thirty (30) days, except where specific transactional records are legally required to be preserved.\n★ Right to Grievance Redressal: The right to escalate data handling complaints to our designated compliance officer or subsequently approach the Data Protection Board of India if our structural solutions do not meet your expectations.\n\nTo execute these rights, submit a clear request detailing your registration identifiers to: support@agrifather.in`,
    tag: 'Your Rights',
    isRights: true,
  },
  {
    id: 'deletion',
    icon: Trash2,
    heading: 'Account Deletion and Data Erasure Process',
    text: `You may request the permanent deletion of your account and all associated personal data at any time. To initiate a deletion request:\n\n1. Navigate to Settings → Profile in the application.\n2. Select "Delete Account" and confirm your identity via OTP verification.\n3. Alternatively, send a written deletion request to: support@agrifather.in with subject line "Data Erasure Request — [Registered Mobile Number]".\n\nUpon successful verification, your personal records will be permanently purged within thirty (30) days. Transaction logs required under Indian tax law will be retained for the legally mandated duration only.`,
    tag: 'Deletion',
  },
];

const tagColors = {
  'Compliance':     { bg: 'rgba(45,168,74,0.1)',  text: '#2da84a' },
  'Data Collection':{ bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  'Image Privacy':  { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
  'Legal Basis':    { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
  'Third Parties':  { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  'Security':       { bg: 'rgba(239,68,68,0.1)',  text: '#ef4444' },
  'Your Rights':    { bg: 'rgba(20,184,166,0.1)', text: '#14b8a6' },
  'Deletion':       { bg: 'rgba(239,68,68,0.1)',  text: '#ef4444' },
};

const Privacy = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <span key={i} className="priv-highlight">{part}</span>
            : part
        )}
      </>
    );
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return privacySections;
    const q = searchQuery.toLowerCase();
    return privacySections.filter(
      s => s.heading.toLowerCase().includes(q) || s.text.toLowerCase().includes(q) || (s.tag || '').toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="privacy-page">
      {/* Sticky Header */}
      <div className="privacy-header">
        <button className="priv-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
          <ArrowLeft size={22} />
        </button>
        <div className="priv-header-text">
          <h2>Privacy Policy</h2>
          <p>DPDP Act, 2023 &amp; IT Rules, 2021 Aligned</p>
        </div>
        <div className="priv-badge">
          <Shield size={14} />
          <span>DPDP 2023</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="privacy-hero">
        <div className="hero-icon-ring">
          <Shield size={32} />
        </div>
        <div className="hero-copy">
          <h3>Your data, your rights.</h3>
          <p>AgriFather operates as a certified <strong>Data Fiduciary</strong> under India's DPDP Act, 2023. We are committed to transparency, minimal data collection, and full respect for your statutory rights as a Data Principal.</p>
        </div>
      </div>

      <div className="privacy-container">
        {/* Search */}
        <div className="priv-search-wrapper">
          <Search size={16} className="priv-search-icon" />
          <input
            type="text"
            className="priv-search-input"
            placeholder="Search the privacy policy..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="priv-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {searchQuery && (
          <p className="priv-results-label">
            {filtered.length} section{filtered.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}

        {/* Cards */}
        <div className="priv-cards-list">
          {filtered.length === 0 ? (
            <div className="priv-no-results">
              <HelpCircle size={36} />
              <p>No sections found. Try a different keyword.</p>
            </div>
          ) : (
            filtered.map((section) => {
              const IconComp = section.icon;
              const tagStyle = tagColors[section.tag] || {};
              let extraClass = '';
              if (section.isCrossBorder) extraClass = ' priv-card--warn';
              if (section.isRights)     extraClass = ' priv-card--rights';
              if (section.isPositive)   extraClass = ' priv-card--positive';

              return (
                <div key={section.id} className={`priv-card${extraClass}`}>
                  <div className="priv-card-header">
                    <div className="priv-icon-wrap">
                      <IconComp size={18} />
                    </div>
                    <div className="priv-card-title-row">
                      <h4 className="priv-card-title">
                        {section.num ? `${section.num}. ` : ''}{highlightText(section.heading, searchQuery)}
                      </h4>
                      {section.tag && (
                        <span
                          className="priv-tag"
                          style={{ background: tagStyle.bg, color: tagStyle.text }}
                        >
                          {section.tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="priv-card-body">
                    {highlightText(section.text, searchQuery)
                      .toString()
                      .split('\n')
                      .map((para, i) => <p key={i}>{para}</p>)
                    }
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cross-link */}
        <div className="priv-crosslink">
          <p>For the full User Agreement, Liability Limitations, and AI Disclaimers, read our</p>
          <button className="priv-crosslink-btn" onClick={() => navigate('/terms')}>
            <FileText size={16} />
            Terms &amp; Conditions
          </button>
        </div>
      </div>

      <div className="priv-footer">
        <p>© 2026 M/s AGRIFATHER — All Rights Reserved</p>
        <p>Flat No. 269, 3rd Floor, Om Apartment, Pocket B Phase 2, Sector 14, Dwarka, Delhi-110078</p>
        <p>Grievance Officer: Shri Chetan Rathi · <a href="mailto:support@agrifather.in">support@agrifather.in</a></p>
      </div>
    </div>
  );
};

export default Privacy;
