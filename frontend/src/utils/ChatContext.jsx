import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadHistory, appendMessages } from './chatHistory';
import { consumeChatToken, getRemainingChats, hasUnlimitedAccess } from './imageTokens';
import { useNotifications } from './NotificationContext';
import API_BASE from './api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatsLeft, setChatsLeft] = useState(0);
  const [chatLimitReached, setChatLimitReached] = useState(false);
  const { addNotification } = useNotifications();

  // Load history on mount
  useEffect(() => {
    setMessages(loadHistory());
    setChatsLeft(getRemainingChats());
  }, []);

  useEffect(() => {
    setChatLimitReached(!hasUnlimitedAccess() && chatsLeft === 0);
  }, [chatsLeft]);

  // Sync when user data is updated globally
  useEffect(() => {
    const handleSync = () => setChatsLeft(getRemainingChats());
    window.addEventListener('user-synced', handleSync);
    return () => window.removeEventListener('user-synced', handleSync);
  }, []);

  const sendMessage = async (text, responseStyle = 'Detailed', langFullName = 'Hindi', selectedModel = 'auto') => {
    if (!text || loading) return { success: false, reason: 'empty' };

    const chatResult = consumeChatToken();
    setChatsLeft(chatResult.remaining ?? getRemainingChats());
    if (!chatResult.allowed) {
      return { success: false, reason: 'limit' };
    }

    const userMsg = { role: 'user', text, id: Date.now(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    appendMessages([userMsg]);
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text,
    }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ message: text, history, responseStyle, language: langFullName, preferredModel: selectedModel }),
      });

      if (res.status === 403) {
        setChatsLeft(0);
        setLoading(false);
        return { success: false, reason: 'limit' };
      }

      const data = await res.json();
      
      // Update local token count from backend response
      if (data.chatTokensUsed !== undefined) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.chatTokensUsed = data.chatTokensUsed;
        localStorage.setItem('user', JSON.stringify(user));
        setChatsLeft(getRemainingChats());
      }

      const aiMsg = {
        role: 'ai',
        text: res.ok ? data.reply : ('⚠️ ' + (data.message || 'Something went wrong.')),
        id: Date.now() + 1,
        timestamp: Date.now(),
      };
      appendMessages([aiMsg]);
      setMessages(prev => [...prev, aiMsg]);

      // If user is not on chat page, send notification
      if (window.location.pathname !== '/chat') {
        addNotification({
          type: 'chat',
          title: 'AgriFather AI has replied',
          subtitle: 'कृषि पिता AI ने उत्तर दिया है',
          description: `Your answer is ready: "${aiMsg.text.slice(0, 100)}..."`,
          shortDesc: 'Your question has been answered. Tap to view.'
        });
      }

    } catch (err) {
      const errMsg = { role: 'ai', text: '⚠️ Could not reach the server. Please check your connection.', id: Date.now() + 1, timestamp: Date.now() };
      appendMessages([errMsg]);
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }

    return { success: true };
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider value={{ messages, loading, chatsLeft, chatLimitReached, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};
