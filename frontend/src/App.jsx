import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './utils/NotificationContext';
import { ChatProvider } from './utils/ChatContext';
import { ScanProvider } from './utils/ScanContext';
import Landing from './pages/Landing';
import Splash from './pages/Splash';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OtpVerify from './pages/OtpVerify';
import Home from './pages/Home';
import Advisory from './pages/Advisory';
import Mandi from './pages/Mandi';
import SeedDetail from './pages/SeedDetail';
import Weather from './pages/Weather';
import PestId from './pages/PestId';
import Livestock from './pages/Livestock';
import Schemes from './pages/Schemes';
import Chat from './pages/Chat';
import Scan from './pages/Scan';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';

import API_BASE from './utils/api';

// Smart root: if user is already logged in, go to /home, else show Landing page
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/home" replace /> : <Landing />;
};

// Sync user data with backend on every app load/refresh
const UserSync = ({ children }) => {
  const [synced, setSynced] = React.useState(false);

  React.useEffect(() => {
    const sync = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Preserve profilePic if backend returns something different or null
            const oldUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newUser = { ...oldUser, ...data.user };
            localStorage.setItem('user', JSON.stringify(newUser));
            window.dispatchEvent(new Event('user-synced'));
          } else if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (err) {
          console.error('User sync failed:', err);
        }
      }
      setSynced(true);
    };
    sync();
  }, []);

  // Show nothing or splash while syncing if desired, but here we just pass through
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <ChatProvider>
            <ScanProvider>
              <UserSync>
                <Router>
                <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/splash" element={<Splash />} />
                <Route path="/verify" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<OtpVerify />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/home" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/advisory" element={<Advisory />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/pest-id" element={<PestId />} />
                <Route path="/livestock" element={<Livestock />} />
                <Route path="/schemes" element={<Schemes />} />
                <Route path="/mandi" element={<Mandi />} />
                <Route path="/seed/:id" element={<SeedDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </UserSync>
        </ScanProvider>
        </ChatProvider>
      </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
