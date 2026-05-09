/**
 * Image Token System
 * ------------------
 * Each user gets 5 image analysis credits per 48 hours.
 * Credits reset automatically after 48 hours from the first use in that window.
 * All data is stored in localStorage.
 *
 * Pro subscribers get unlimited access — token limits are bypassed.
 */

function getUserId() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user._id) return user._id;
    }
  } catch {}
  return 'guest';
}

function getTokenKey() { return `af_image_tokens_${getUserId()}`; }
function getSubKey() { return `af_subscription_${getUserId()}`; }

const MAX_TOKENS    = 5;
const WINDOW_MS     = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Check if the user has an active Pro subscription.
 * @returns {{ active: boolean, plan?: string, planName?: string, expiresAt?: number }}
 */
export function getSubscriptionStatus() {
  try {
    const raw = localStorage.getItem(getSubKey());
    if (!raw) return { active: false };
    const sub = JSON.parse(raw);
    // Check if subscription has expired
    if (sub.expiresAt && Date.now() > new Date(sub.expiresAt).getTime()) {
      // Subscription expired — clear it
      localStorage.removeItem(getSubKey());
      return { active: false };
    }
    return { active: !!sub.active, ...sub };
  } catch {
    return { active: false };
  }
}

/**
 * Returns true if user has unlimited (Pro) access.
 */
export function hasUnlimitedAccess() {
  return getSubscriptionStatus().active;
}

/**
 * Load token state from localStorage.
 * @returns {{ used: number, windowStart: number }}
 */
function loadTokenState() {
  try {
    const raw = localStorage.getItem(getTokenKey());
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { used: 0, windowStart: Date.now() };
}

/**
 * Save token state to localStorage.
 */
function saveTokenState(state) {
  localStorage.setItem(getTokenKey(), JSON.stringify(state));
}

/**
 * Get fresh token state (auto-resets if 48h window has passed).
 * @returns {{ used: number, windowStart: number }}
 */
function getFreshState() {
  const state = loadTokenState();
  const now   = Date.now();
  if (now - state.windowStart >= WINDOW_MS) {
    // Reset window
    const fresh = { used: 0, windowStart: now };
    saveTokenState(fresh);
    return fresh;
  }
  return state;
}

/**
 * Returns how many image scans remain in the current 48-hour window.
 * Pro users always get Infinity.
 * @returns {number} 0–5 or Infinity
 */
export function getRemainingTokens() {
  if (hasUnlimitedAccess()) return Infinity;
  const state = getFreshState();
  return Math.max(0, MAX_TOKENS - state.used);
}

/**
 * Returns total max tokens.
 * @returns {number} 5
 */
export function getMaxTokens() {
  return MAX_TOKENS;
}

/**
 * Returns ms until the next token reset.
 * @returns {number}
 */
export function getMsUntilReset() {
  const state = getFreshState();
  const elapsed = Date.now() - state.windowStart;
  return Math.max(0, WINDOW_MS - elapsed);
}

/**
 * Human-readable countdown string like "36h 12m".
 * @returns {string}
 */
export function getResetCountdown() {
  const ms = getMsUntilReset();
  const totalMins = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins  = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Attempt to consume one token for an image scan.
 * Pro subscribers always succeed.
 * @returns {{ allowed: boolean, remaining: number, resetIn?: string }}
 */
export function consumeImageToken() {
  // Pro users bypass token limits
  if (hasUnlimitedAccess()) {
    return { allowed: true, remaining: Infinity };
  }

  const state = getFreshState();
  if (state.used >= MAX_TOKENS) {
    return { allowed: false, remaining: 0, resetIn: getResetCountdown() };
  }
  const updated = { ...state, used: state.used + 1 };
  saveTokenState(updated);
  return { allowed: true, remaining: MAX_TOKENS - updated.used };
}


// ═════════════════════════════════════════════════════════════════════════════
//  Chat Token System  —  10 messages per 24 hours (free users only)
// ═════════════════════════════════════════════════════════════════════════════

function getChatTokenKey() { return `af_chat_tokens_${getUserId()}`; }
const MAX_CHAT        = 10;
const CHAT_WINDOW_MS  = 24 * 60 * 60 * 1000; // 24 hours

function loadChatState() {
  try {
    const raw = localStorage.getItem(getChatTokenKey());
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { used: 0, windowStart: Date.now() };
}

function saveChatState(state) {
  localStorage.setItem(getChatTokenKey(), JSON.stringify(state));
}

function getFreshChatState() {
  const state = loadChatState();
  const now   = Date.now();
  if (now - state.windowStart >= CHAT_WINDOW_MS) {
    const fresh = { used: 0, windowStart: now };
    saveChatState(fresh);
    return fresh;
  }
  return state;
}

/** How many chat messages remain today. Pro = Infinity. */
export function getRemainingChats() {
  if (hasUnlimitedAccess()) return Infinity;
  const state = getFreshChatState();
  return Math.max(0, MAX_CHAT - state.used);
}

/** Max chat messages per window. */
export function getMaxChats() {
  return MAX_CHAT;
}

/** ms until the chat window resets. */
export function getMsUntilChatReset() {
  const state = getFreshChatState();
  return Math.max(0, CHAT_WINDOW_MS - (Date.now() - state.windowStart));
}

/** Human-readable countdown for chat reset. */
export function getChatResetCountdown() {
  const ms = getMsUntilChatReset();
  const totalMins = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins  = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Attempt to consume one chat message token.
 * Pro subscribers always succeed.
 * @returns {{ allowed: boolean, remaining: number, resetIn?: string }}
 */
export function consumeChatToken() {
  if (hasUnlimitedAccess()) {
    return { allowed: true, remaining: Infinity };
  }
  const state = getFreshChatState();
  if (state.used >= MAX_CHAT) {
    return { allowed: false, remaining: 0, resetIn: getChatResetCountdown() };
  }
  const updated = { ...state, used: state.used + 1 };
  saveChatState(updated);
  return { allowed: true, remaining: MAX_CHAT - updated.used };
}
