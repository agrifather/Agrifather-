import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './utils/NotificationContext';
import { ChatProvider } from './utils/ChatContext';
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

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <ChatProvider>
            <Router>
            <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/verify" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<OtpVerify />} />
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
            </Router>
          </ChatProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
