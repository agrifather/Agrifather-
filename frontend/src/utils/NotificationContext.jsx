import React, { createContext, useContext, useState, useEffect } from 'react';
import { AlertTriangle, CloudRain, TrendingUp, Sprout, MessageSquare } from 'lucide-react';
import { getUserItem } from './userStorage';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'alert',
      title: 'Locust Swarm Alert in Your Area',
      subtitle: 'आपके क्षेत्र में टिड्डी दल की चेतावनी',
      description: 'A large locust swarm has been detected moving towards your district. Please take immediate preventive measures to protect your crops. Use appropriate insecticides and create noise to keep them away.',
      shortDesc: 'Large locust swarm detected moving towards your district...',
      time: Date.now() - 3600000,
      unread: true
    },
    {
      id: 2,
      type: 'weather',
      title: 'Heavy Rainfall Expected',
      subtitle: 'भारी बारिश की उम्मीद',
      description: '80mm rainfall predicted in the next 48 hours. Ensure proper drainage in your fields and delay any planned fertilizer application until the weather clears up.',
      shortDesc: '80mm rainfall predicted in the next 48 hours. Ensure proper drainage...',
      time: Date.now() - 18000000,
      unread: true
    },
    {
      id: 3,
      type: 'price',
      title: 'Mandi Price Update',
      subtitle: 'मंडी भाव अपडेट',
      description: 'Wheat prices have increased by ₹50/quintal at your local Mandi. Current average price is ₹2,250/quintal. Good time to sell if you have stocks ready.',
      shortDesc: 'Wheat prices have increased by ₹50/quintal at your local Mandi...',
      time: Date.now() - 86400000,
      unread: false
    }
  ]);

  const addNotification = (notif) => {
    setNotifications(prev => [{ ...notif, id: Date.now(), unread: true, time: Date.now() }, ...prev]);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Simulate real-time notifications based on location and crops
  useEffect(() => {
    const location = getUserItem('af_location', 'Vidarbha, Maharashtra');
    const cropsRaw = getUserItem('af_crops');
    let crops = ['Wheat'];
    try { if (cropsRaw) crops = JSON.parse(cropsRaw); } catch {}

    const timers = [];

    // Simulate weather change based on location
    timers.push(setTimeout(() => {
      addNotification({
        type: 'weather',
        title: `Sudden Weather Change in ${location}`,
        subtitle: 'मौसम में अचानक बदलाव',
        description: `Unexpected cloud cover and high humidity detected in ${location}. This might increase the risk of fungal diseases.`,
        shortDesc: `Unexpected cloud cover and high humidity detected in ${location}.`
      });
    }, 15000)); // 15 seconds after load

    // Simulate locust attack
    if (location.toLowerCase().includes('rajasthan') || location.toLowerCase().includes('gujarat')) {
      timers.push(setTimeout(() => {
        addNotification({
          type: 'alert',
          title: 'High Alert: Locust Swarm Approaching',
          subtitle: 'हाई अलर्ट: टिड्डी दल आ रहा है',
          description: `Farmers in ${location} must be vigilant. A locust swarm is 20km away.`,
          shortDesc: `Farmers in ${location} must be vigilant. Locust swarm 20km away.`
        });
      }, 25000));
    }

    // Simulate Mandi rates for their crops
    if (crops.length > 0) {
      timers.push(setTimeout(() => {
        addNotification({
          type: 'price',
          title: `${crops[0]} Price Surge!`,
          subtitle: 'मंडी भाव में उछाल',
          description: `Prices for ${crops[0]} have increased by ₹120/quintal in your nearest Mandi. Perfect time to plan your sales.`,
          shortDesc: `Prices for ${crops[0]} have increased by ₹120/quintal in your nearest Mandi.`
        });
      }, 35000));
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
