import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAppContext } from './context/AppContext';
import Header from './components/Header';
import OverviewCards from './components/OverviewCards';
import TransactionForm from './components/TransactionForm';
import Login from './components/Login';
import BudgetProgress from './components/BudgetProgress';
import MonthSelector from './components/MonthSelector';
import Footer from './components/Footer';
import RecurringTracker from './components/RecurringTracker';
import PWAUpdateToast from './components/PWAUpdateToast';
import AppUpdatePrompt from './components/AppUpdatePrompt';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';

const HistoryPage = React.lazy(() => import('./components/HistoryPage'));
const AnalyticsPage = React.lazy(() => import('./components/AnalyticsPage'));
const SettingsPage = React.lazy(() => import('./components/Settings'));
const LedgerPage = React.lazy(() => import('./components/Ledger'));



const Dashboard = () => (
  <>
    <Header />
    <main className="container animate-fade-in" style={{ flex: 1 }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }} className="animate-fade-in stagger-1">
        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Dashboard</h2>
        <p>Track your daily, monthly, and yearly expenses. Build your savings.</p>
      </div>

      <div className="animate-fade-in stagger-2">
        <MonthSelector />
      </div>

      <div className="animate-fade-in stagger-3">
        <OverviewCards />
      </div>

      <div className="dashboard-grid animate-fade-in stagger-4">
        {/* Left: form stretches to fill column height */}
        <div className="dashboard-left-col">
          <TransactionForm />
        </div>

        {/* Right: Budget + Recurring stacked */}
        <div className="flex-col gap-6" style={{ width: '100%' }}>
          <BudgetProgress />
          <RecurringTracker />
        </div>
      </div>
    </main>
    <Footer />
  </>
);

// Lazy-loaded pages loaded via react-router-dom below

const ProtectedRoute = ({ children }) => {
  const { session, loading, isOnboardingNeeded } = useAppContext();
  
  if (loading) {
    return <SplashScreen />;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isOnboardingNeeded) {
    return <Onboarding />;
  }
  
  return children;
};

const NotificationNavigationHandler = () => {
  const { highlightedBill, setHighlightedBill } = useAppContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (highlightedBill && highlightedBill.triggerNavigate) {
      setHighlightedBill(prev => ({ ...prev, triggerNavigate: false }));
      navigate('/');
    }
  }, [highlightedBill, navigate, setHighlightedBill]);

  return null;
};

function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const askPermissionOnFirstLaunch = async () => {
      if (Capacitor.isNativePlatform()) {
        const asked = localStorage.getItem('trackify_asked_notification_permission');
        if (!asked) {
          try {
            await LocalNotifications.requestPermissions();
          } catch (e) {
            console.error('Error requesting notification permissions:', e);
          } finally {
            localStorage.setItem('trackify_asked_notification_permission', 'true');
          }
        }
      }
    };
    askPermissionOnFirstLaunch();
  }, []);

  const { loading } = useAppContext();

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationNavigationHandler />
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <Suspense fallback={<SplashScreen />}>
                <HistoryPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Suspense fallback={<SplashScreen />}>
                <AnalyticsPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Suspense fallback={<SplashScreen />}>
                <SettingsPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/ledger" element={
            <ProtectedRoute>
              <Suspense fallback={<SplashScreen />}>
                <LedgerPage />
              </Suspense>
            </ProtectedRoute>
          } />
        </Routes>
        {!Capacitor.isNativePlatform() && <PWAUpdateToast />}
        <AppUpdatePrompt />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// Redirect logged in users away from login
const LoginRoute = () => {
  const { session, loading } = useAppContext();
  
  if (loading) {
    return null;
  }
  
  if (session) {
    return <Navigate to="/" replace />;
  }
  
  return <Login />;
};

export default App;
