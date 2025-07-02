import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import UserList from './pages/UserList.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ChartPage from './pages/ChartPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import UserSettingsPage from './pages/UserSettingsPage.jsx';
import SideNav from './components/SideNav.jsx';

const Layout = ({ children }) => {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const adminThemeMode = useSelector((state) => state.adminSettings?.settings?.themeMode);
  const userThemeMode = useSelector((state) => state.userSettings?.settings?.themeMode);

  // Show SideNav only if user is logged in and not on login/register/home pages
  const hideNavPaths = ['/', '/login', '/register'];
  const showSideNav = user && !hideNavPaths.includes(location.pathname);

  // For home, login, register pages make full screen without padding and margin
  const fullScreenPaths = ['/', '/login', '/register'];
  const isFullScreen = fullScreenPaths.includes(location.pathname);

  // Determine theme class based on themeMode and user role
  let themeClass = '';
  if (user && user.role === 'admin') {
    if (adminThemeMode === 'dark') {
      themeClass = 'dark-theme';
    } else if (adminThemeMode === 'creative') {
      themeClass = 'creative-theme';
    } else {
      themeClass = ''; // white-black or default
    }
  } else {
    if (userThemeMode === 'dark') {
      themeClass = 'dark-theme';
    } else if (userThemeMode === 'creative') {
      themeClass = 'creative-theme';
    } else {
      themeClass = ''; // white-black or default
    }
  }

  return (
    <div className={`flex min-h-screen ${themeClass}`}>
      {showSideNav && <SideNav />}
      <div
        className={
          showSideNav
            ? 'flex-grow ml-64 p-6'
            : isFullScreen
            ? 'flex-grow m-0 p-0'
            : 'flex-grow p-6'
        }
      >
        {children}
      </div>
    </div>
  );
};

function App() {
  const user = useSelector((state) => state.auth.user);

  const AdminRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/charts" element={user ? <ChartPage /> : <Navigate to="/login" replace />} />
          <Route path="/history" element={user ? <HistoryPage /> : <Navigate to="/login" replace />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/user-list"
            element={
              <AdminRoute>
                <UserList />
              </AdminRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/user-settings"
            element={user ? <UserSettingsPage /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
