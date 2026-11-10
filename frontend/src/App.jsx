import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import CustomerPortal from './pages/CustomerPortal';
import AdminWorkspace from './pages/AdminWorkspace';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('resolve_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('resolve_user');
    return saved ? JSON.parse(saved) : null;
  });

  // ✅ Default Dark Theme = true (Linear + Zendesk Dark SaaS Theme by default)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('resolve_theme');
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });

  useEffect(() => {
    localStorage.setItem('resolve_theme', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('resolve_token', newToken);
    localStorage.setItem('resolve_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('resolve_token');
    localStorage.removeItem('resolve_user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <AuthPage darkMode={darkMode} setDarkMode={setDarkMode} onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.role === 'Customer') {
    return <CustomerPortal user={user} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />;
  }

  return <AdminWorkspace user={user} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />;
}