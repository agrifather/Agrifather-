/**
 * Image Token System (Synced with Backend)
 * ---------------------------------------
 * Each user gets 5 image analysis credits per 24 hours.
 * Each user gets Unlimited chat messages.
 * 
 * This module now reads from the 'user' object in localStorage,
 * which is kept in sync with the backend database.
 */

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch { return {}; }
}

function getUserId() {
  return getUser()._id || 'guest';
}

/**
 * Check if the user has an active Pro subscription.
 */
export function getSubscriptionStatus() {
  try {
    const raw = localStorage.getItem(`af_subscription_${getUserId()}`);
    if (!raw) return { active: false };
    const sub = JSON.parse(raw);
    if (sub.expiresAt && Date.now() > new Date(sub.expiresAt).getTime()) {
      localStorage.removeItem(`af_subscription_${getUserId()}`);
      return { active: false };
    }
    return { active: !!sub.active, ...sub };
  } catch {
    return { active: false };
  }
}

export function hasUnlimitedAccess() {
  return getSubscriptionStatus().active;
}

// ─── Image Tokens ─────────────────────────────────────────────────────────────
const MAX_TOKENS = 5;

export function getRemainingTokens() {
  if (hasUnlimitedAccess()) return Infinity;
  const user = getUser();
  // If guest, fall back to localStorage 'guest' tracking or just return 0
  if (!user._id) return 0; 
  return Math.max(0, MAX_TOKENS - (user.imageTokensUsed || 0));
}

export function getMaxTokens() { return MAX_TOKENS; }

// ─── Chat Tokens ──────────────────────────────────────────────────────────────
const MAX_CHAT = 999999; // Effectively unlimited

export function getRemainingChats() {
  if (hasUnlimitedAccess()) return Infinity;
  const user = getUser();
  if (!user._id) return 0;
  return Math.max(0, MAX_CHAT - (user.chatTokensUsed || 0));
}

export function getMaxChats() { return MAX_CHAT; }

/**
 * Note: consumeChatToken and consumeImageToken are now handled primarily 
 * by the backend. These frontend helpers are kept for UI compatibility 
 * but the source of truth is the backend response.
 */
export function consumeChatToken() {
  return { allowed: true, remaining: Infinity };
}

export function consumeImageToken() {
  if (hasUnlimitedAccess()) return { allowed: true, remaining: Infinity };
  const user = getUser();
  const used = (user.imageTokensUsed || 0);
  if (used >= MAX_TOKENS) return { allowed: false, remaining: 0 };
  
  user.imageTokensUsed = used + 1;
  localStorage.setItem('user', JSON.stringify(user));
  
  return { allowed: true, remaining: MAX_TOKENS - user.imageTokensUsed };
}

// Countdown helpers (stubbed for now as backend owns the timer)
export function getChatResetCountdown() { return "24h"; }
export function getResetCountdown() { return "24h"; }
export function getMsUntilChatReset() { return 0; }
export function getMsUntilReset() { return 0; }
