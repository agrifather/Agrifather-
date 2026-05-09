import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, CloudRain, TrendingUp, Sprout, Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useNotifications } from '../utils/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedNotif, setSelectedNotif] = useState(null);

  const filters = ['All', 'Alerts', 'Weather', 'Prices', 'Crops', 'Chat'];

  const getIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={20} color="#ef4444" />;
      case 'weather': return <CloudRain size={20} color="#3b82f6" />;
      case 'price': return <TrendingUp size={20} color="#2da84a" />;
      case 'crop': return <Sprout size={20} color="#65a30d" />;
      case 'chat': return <Bell size={20} color="#8b5cf6" />;
      default: return <Bell size={20} color="#2da84a" />;
    }
  };
  
  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    if (notif.type === 'chat') {
      navigate('/chat');
    } else {
      setSelectedNotif(notif);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-left">
          <ArrowLeft size={24} className="back-icon" onClick={() => navigate(-1)} />
          <div>
            <h2 className="header-title">Notifications</h2>
            <p className="header-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
        </div>
        <div className="header-right" onClick={markAllRead} style={{cursor: 'pointer'}}>
          <CheckCircle2 size={16} className="mark-read-icon" />
          <span className="mark-read-text">Mark all read</span>
        </div>
      </div>

      <div className="notifications-list">
        {notifications
          .filter(n => activeFilter === 'All' || activeFilter.toLowerCase().includes(n.type))
          .map((notif) => (
          <div key={notif.id} className="notification-card" onClick={() => handleNotifClick(notif)} style={{cursor: 'pointer'}}>
            {notif.unread && <div className="unread-dot"></div>}
            
            <div className="notif-icon-container">
              {getIcon(notif.type)}
            </div>
            
            <div className="notif-content">
              <h3 className="notif-title">{notif.title}</h3>
              <p className="hindi-text notif-subtitle">{notif.subtitle}</p>
              <p className="notif-desc">{notif.shortDesc || notif.description}</p>
              <span className="notif-time">{typeof notif.time === 'number' ? new Date(notif.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : notif.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        {filters.map(filter => (
          <button 
            key={filter} 
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Notification Modal */}
      {selectedNotif && (
        <div className="notif-modal-overlay" onClick={() => setSelectedNotif(null)}>
          <div className="notif-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <div className="notif-icon-container" style={{height: 56, width: 56, borderRadius: 16}}>
                {getIcon(selectedNotif.type)}
              </div>
              <X size={24} color="#666" className="notif-close-icon" onClick={() => setSelectedNotif(null)} style={{cursor: 'pointer'}} />
            </div>
            <h3 className="notif-modal-title">{selectedNotif.title}</h3>
            <p className="hindi-text notif-modal-subtitle">{selectedNotif.subtitle}</p>
            <div className="notif-modal-body">
              <p>{selectedNotif.description}</p>
            </div>
            <button className="notif-modal-btn" onClick={() => setSelectedNotif(null)}>Close</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Notifications;
