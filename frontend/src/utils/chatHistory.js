/* ── Chat History utility ─────────────────────────────────────────────────────
   Stores up to 100 messages in localStorage under 'af_chat_history'.
   Each message: { role: 'user'|'ai', text: string, id: number, timestamp: number }
─────────────────────────────────────────────────────────────────────────────── */

const MAX_MSGS    = 100;

function getStorageKey() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user._id) {
        return `af_chat_history_${user._id}`;
      }
    }
  } catch {}
  return 'af_chat_history_guest';
}

/** Load all messages from localStorage */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Append new messages and persist (keeps last MAX_MSGS) */
export function appendMessages(newMessages) {
  try {
    const existing = loadHistory();
    const merged   = [...existing, ...newMessages].slice(-MAX_MSGS);
    localStorage.setItem(getStorageKey(), JSON.stringify(merged));
  } catch {}
}

/** Clear all history */
export function clearHistory() {
  localStorage.removeItem(getStorageKey());
}

/** Return last N conversation summaries for home page display */
export function getRecentConversations(limit = 5) {
  const history = loadHistory();
  if (history.length === 0) return [];

  // Group into conversation turns: each user message + its AI reply = one item
  const convos = [];
  for (let i = 0; i < history.length; i++) {
    if (history[i].role === 'user') {
      convos.push({
        id:        history[i].id,
        userText:  history[i].text,
        timestamp: history[i].timestamp || history[i].id,
      });
    }
  }
  // Return last N, most recent first
  return convos.slice(-limit).reverse();
}

/** Format timestamp as human-readable "just now / 2h ago / Yesterday / date" */
export function timeAgo(ts) {
  if (!ts) return '';
  const now  = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
