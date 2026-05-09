import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Leaf, Loader, Trash2, Camera, ArrowUp, Crown, Mic, MicOff, Zap, BookOpen, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { loadHistory, appendMessages, clearHistory } from '../utils/chatHistory';
import { getChatResetCountdown, hasUnlimitedAccess, getMaxChats } from '../utils/imageTokens';
import { useChat } from '../utils/ChatContext';
import { getUserItem, setUserItem } from '../utils/userStorage';
import { useLanguage } from '../context/LanguageContext';
import '../pages/Subscription.css';
import './Chat.css';

// ─── Suggestion chips (shown on empty state) ──────────────────────────────────
const SUGGESTIONS = [
  '🌾 Wheat disease treatment',
  '💧 Drip irrigation tips',
  '🌿 Organic pest control',
  '📋 PM Kisan scheme benefits',
  '🪲 Identify crop pest',
  '🌡️ Heat stress in crops',
];

// ─── Markdown renderer ────────────────────────────────────────────────────────
function formatInline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
}

function FormatText({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line    = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { elements.push(<div key={i} className="md-spacer" />); i++; continue; }
    if (/^[-_*]{3,}\s*$/.test(trimmed)) { elements.push(<hr key={i} className="md-divider" />); i++; continue; }

    if (/^###\s+/.test(trimmed)) {
      elements.push(<h4 key={i} className="md-h3" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^###\s+/, '')) }} />);
      i++; continue;
    }
    if (/^##\s+/.test(trimmed)) {
      elements.push(<h3 key={i} className="md-h2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^##\s+/, '')) }} />);
      i++; continue;
    }
    if (/^#\s+/.test(trimmed)) {
      elements.push(<h2 key={i} className="md-h2" style={{ fontSize: '1.1rem' }} dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^#\s+/, '')) }} />);
      i++; continue;
    }

    // Bullet list
    if (/^[\s]*[-•*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\s]*[-•*]\s+/.test(lines[i])) {
        items.push(<li key={i} dangerouslySetInnerHTML={{ __html: formatInline(lines[i].replace(/^[\s]*[-•*]\s+/, '')) }} />);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="md-ul">{items}</ul>);
      continue;
    }

    // Numbered list
    if (/^[\s]*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\s]*\d+[.)]\s+/.test(lines[i])) {
        items.push(<li key={i} dangerouslySetInnerHTML={{ __html: formatInline(lines[i].replace(/^[\s]*\d+[.)]\s+/, '')) }} />);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="md-ol">{items}</ol>);
      continue;
    }

    elements.push(<p key={i} className="md-p" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />);
    i++;
  }

  return <div className="bubble-content">{elements}</div>;
}

function getUserInitial() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (user.name || 'U').charAt(0).toUpperCase();
  } catch { return 'U'; }
}

// ─── Speech Recognition Helper ────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// ─── Main Component ───────────────────────────────────────────────────────────
const Chat = () => {
  const navigate    = useNavigate();
  const { messages, loading, chatsLeft, chatLimitReached, sendMessage, clearChat } = useChat();
  const { t, langFullName } = useLanguage(); // get translations and language name
  const [input,    setInput]    = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [responseStyle, setResponseStyle] = useState(() => getUserItem('af_responseStyle', 'Detailed'));
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const messagesEndRef   = useRef(null);
  const messagesAreaRef  = useRef(null);
  const inputRef         = useRef(null);
  const recognitionRef   = useRef(null);
  const userInitial      = getUserInitial();
  const isPro            = hasUnlimitedAccess();

  const RESPONSE_STYLES = [
    { id: 'Brief', label: t('brief'), icon: Zap, desc: 'Short & quick' },
    { id: 'Detailed', label: t('detailed'), icon: BookOpen, desc: 'Full explanation' },
    { id: 'Expert', label: t('expert'), icon: GraduationCap, desc: 'Technical depth' },
  ];

  const MIC_LANG_MAP = {
    'English': 'en-IN',
    'Hindi': 'hi-IN',
    'Marathi': 'mr-IN',
    'Punjabi': 'pa-IN',
    'Gujarati': 'gu-IN'
  };

  // Save response style preference
  useEffect(() => {
    setUserItem('af_responseStyle', responseStyle);
  }, [responseStyle]);

  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setInput(prev => {
        const base = prev.replace(/🎤.*$/, '').trim();
        if (finalTranscript) {
          return (base ? base + ' ' : '') + finalTranscript;
        }
        return (base ? base + ' ' : '') + '🎤 ' + interimTranscript;
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      // Clean up interim markers
      setInput(prev => prev.replace(/🎤\s*/g, '').trim());
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      console.error("SpeechRecognition error:", event.error);
      if (event.error === 'not-allowed') {
        setMicError('Mic access denied or requires HTTPS.');
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Try again.');
      } else if (event.error === 'network') {
        setMicError('Network Error: If you are using Brave or a privacy browser, speech recognition is blocked by default.');
      } else {
        setMicError('Mic error: ' + event.error);
      }
      setTimeout(() => setMicError(''), 6000); // give them more time to read it
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const toggleMic = () => {
    if (!SpeechRecognition) {
      setMicError('Speech recognition not supported in this browser.');
      setTimeout(() => setMicError(''), 4000);
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setMicError('Microphone requires HTTPS or localhost.');
      setTimeout(() => setMicError(''), 4000);
      return;
    }

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch(e) {}
      setIsListening(false);
    } else {
      setMicError('');
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = MIC_LANG_MAP[langFullName] || 'hi-IN';
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (err) {
        console.error("Failed to start mic:", err);
        setMicError('Could not start microphone.');
        setTimeout(() => setMicError(''), 4000);
      }
    }
  };

  // Reliable scroll-to-bottom: uses scrollTop on the container
  const scrollToBottom = useCallback((instant = false) => {
    const doScroll = () => {
      if (messagesAreaRef.current) {
        messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
    };
    doScroll();
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    // Auto-stop mic if user starts typing manually
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch(e) {}
      setIsListening(false);
      // Clean up interim markers before adding new typed text
      const cleanVal = e.target.value.replace(/🎤\s*/g, '');
      setInput(cleanVal);
    } else {
      setInput(e.target.value);
    }
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const handleSendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    // Stop mic if listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    scrollToBottom(true);

    // Pass langFullName to backend to enforce response language
    const result = await sendMessage(text, responseStyle, langFullName);
    
    if (!result.success && result.reason === 'limit') {
      setShowUpgradeModal(true);
      setInput(text);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleClear = () => {
    clearChat();
    clearHistory();
  };

  return (
    <div className="chat-container">
      {/* ── Header ── */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar-large">
            <Leaf size={18} color="#fff" />
          </div>
          <div>
            <h2 className="chat-title">{t('chatTitle')}</h2>
            <p className="chat-status">
              <span className="status-dot" />
              {t('chatStatus')}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <div className="chat-quota-badge" title="Messages remaining today">
            {isPro ? (
              <><Crown size={13} /> Pro</>
            ) : (
              <>💬 {chatsLeft}/{getMaxChats()}</>
            )}
          </div>
          <button className="chat-icon-action" onClick={() => navigate('/scan')} title={t('scanImage')}>
            <Camera size={17} />
          </button>
          <button className="chat-icon-action chat-clear-btn" onClick={handleClear} title={t('clearChat')}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Response Style Selector Bar ── */}
      <div className="response-style-bar">
        {RESPONSE_STYLES.map((style) => {
          const Icon = style.icon;
          return (
            <button
              key={style.id}
              className={`response-style-chip ${responseStyle === style.id ? 'active' : ''}`}
              onClick={() => setResponseStyle(style.id)}
              title={style.desc}
            >
              <Icon size={13} />
              <span>{style.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages" ref={messagesAreaRef}>

        {/* Empty / Welcome state */}
        {messages.length === 0 && !loading && (
          <div className="chat-welcome">
            <div className="chat-welcome-logo">
              <Leaf size={30} color="#fff" />
            </div>
            <h2>{t('howCanIHelp')}</h2>
            <p>{t('chatDesc')}</p>
            {!isPro && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                💬 {chatsLeft} of {getMaxChats()} {t('freeMessages')}
              </p>
            )}
            <div className="chat-suggestion-chips">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSendMessage(s)} disabled={chatLimitReached}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'sent' : 'received'}`}>
            {msg.role === 'ai' && (
              <div className="message-avatar ai-avatar"><Leaf size={15} /></div>
            )}
            <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
              {msg.role === 'ai'
                ? <FormatText text={msg.text} />
                : <div className="bubble-content"><p className="md-p">{msg.text}</p></div>
              }
            </div>
            {msg.role === 'user' && (
              <div className="message-avatar user-avatar">{userInitial}</div>
            )}
          </div>
        ))}

        {/* Chat limit warning inline */}
        {chatLimitReached && (
          <div className="message-row received">
            <div className="message-avatar ai-avatar"><Leaf size={15} /></div>
            <div className="message-bubble ai-bubble">
              <div className="bubble-content">
                <p className="md-p">
                  🚫 You've used all <strong>{getMaxChats()}</strong> free messages for today. Resets in <strong>{getChatResetCountdown()}</strong>.
                </p>
                <p className="md-p" style={{ marginTop: 8 }}>
                  <button
                    onClick={() => navigate('/subscription')}
                    style={{
                      background: 'var(--primary-color)', color: '#fff', border: 'none',
                      padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.85rem', fontFamily: 'inherit',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <Crown size={14} /> Upgrade to Pro — Unlimited
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="message-row received">
            <div className="message-avatar ai-avatar"><Leaf size={15} /></div>
            <div className="message-bubble ai-bubble typing-bubble">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Mic Error Toast ── */}
      {micError && (
        <div className="mic-error-toast">
          <MicOff size={14} />
          {micError}
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="chat-input-area">
        <button className="chat-scan-shortcut" onClick={() => navigate('/scan')} title={t('scanImage')}>
          <Camera size={18} />
        </button>

        {/* Voice Mic Button */}
        <button
          className={`chat-mic-btn ${isListening ? 'mic-active' : ''}`}
          onClick={toggleMic}
          title={isListening ? 'Stop listening' : 'Speak your question'}
          disabled={loading || chatLimitReached}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening && <span className="mic-pulse" />}
        </button>

        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-textarea hindi-text"
            placeholder={chatLimitReached ? t('limitReached') : isListening ? t('listeningPlaceholder') : t('msgPlaceholder')}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading || chatLimitReached}
          />
        </div>
        <button
          className={`icon-btn send-btn ${(!input.trim() || loading || chatLimitReached) ? 'send-disabled' : ''}`}
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || loading || chatLimitReached}
          title="Send"
        >
          {loading
            ? <Loader size={17} color="#fff" className="spin-icon" />
            : <ArrowUp size={18} color="#fff" />
          }
        </button>
      </div>

      {/* ── Chat Limit Upgrade Modal ── */}
      {showUpgradeModal && (
        <div className="token-expired-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="token-expired-card" onClick={(e) => e.stopPropagation()}>
            <div className="expired-icon">💬</div>
            <h3>{t('dailyLimit')}</h3>
            <p>You've used all {getMaxChats()} free messages for today.</p>
            <p className="reset-timer">⏱ Resets in {getChatResetCountdown()}</p>
            <div className="token-expired-actions">
              <button className="upgrade-btn" onClick={() => navigate('/subscription')}>
                <Crown size={16} /> Upgrade to Pro — Unlimited Messages
              </button>
              <button className="dismiss-btn" onClick={() => setShowUpgradeModal(false)}>
                {t('waitReset')}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Chat;
