import React from 'react';
import { Home, MessageSquare, ScanLine, Bell, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../utils/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="bottom-nav">
      <div className={`nav-item ${isActive('/home')}`} onClick={() => navigate('/home')}>
        <div className="icon-bg">
          <Home size={22} className="nav-icon" />
        </div>
        <span className="nav-label">{t('navHome')}</span>
      </div>
      <div className={`nav-item ${isActive('/chat')}`} onClick={() => navigate('/chat')}>
        <div className="icon-bg">
          <MessageSquare size={22} className="nav-icon" />
        </div>
        <span className="nav-label">{t('navChat')}</span>
      </div>
      
      <div className={`nav-item ${isActive('/scan')}`} onClick={() => navigate('/scan')}>
        <div className="icon-bg">
          <ScanLine size={22} className="nav-icon" />
        </div>
        <span className="nav-label">{t('navScan')}</span>
      </div>

      <div className={`nav-item ${isActive('/notifications')}`} onClick={() => navigate('/notifications')}>
        <div className="icon-bg" style={{position: 'relative'}}>
          <Bell size={22} className="nav-icon" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white',
              fontSize: '0.65rem', fontWeight: 'bold', width: 16, height: 16, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white'
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <span className="nav-label">{t('navNotifications')}</span>
      </div>
      <div className={`nav-item ${isActive('/settings')}`} onClick={() => navigate('/settings')}>
        <div className="icon-bg">
          <Settings size={22} className="nav-icon" />
        </div>
        <span className="nav-label">{t('navSettings')}</span>
      </div>
    </div>
  );
};

export default BottomNav;
