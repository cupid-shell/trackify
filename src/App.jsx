import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAppContext } from './context/AppContext';
import Header from './components/Header';
import OverviewCards from './components/OverviewCards';
import TransactionForm from './components/TransactionForm';
import RecentTransactions from './components/RecentTransactions';
import ExpenseChart from './components/ExpenseChart';
import PredictionEngine from './components/PredictionEngine';
import Login from './components/Login';
import SettingsPage from './components/Settings';
import BudgetProgress from './components/BudgetProgress';
import TrendChart from './components/TrendChart';
import MonthSelector from './components/MonthSelector';
import Footer from './components/Footer';
import RecurringTracker from './components/RecurringTracker';
import FinancialInsights from './components/FinancialInsights';
import ExpenseCalendar from './components/ExpenseCalendar';
import HealthScore from './components/HealthScore';
import SavingsGoals from './components/SavingsGoals';
import LedgerPage from './components/Ledger';
import PWAUpdateToast from './components/PWAUpdateToast';



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
        {/* Left Column: Add transactions + Recurring Bills */}
        <div className="flex-col gap-6" style={{ width: '100%' }}>
          <TransactionForm />
          <RecurringTracker />
        </div>

        {/* Right Column: Budget progress */}
        <div style={{ width: '100%' }}>
          <BudgetProgress />
        </div>
      </div>
    </main>
    <Footer />
  </>
);

const HistoryPage = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const handleToggle = (mode) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setViewMode(mode);
      });
    } else {
      setViewMode(mode);
    }
  };

  return (
    <>
      <Header />
      <main className="container animate-fade-in" style={{ flex: 1 }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }} className="animate-fade-in stagger-1">
          <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Expense Log</h2>
          <p>View your complete transaction history.</p>
        </div>
        
        <div className="animate-fade-in stagger-2">
          <MonthSelector />
        </div>

        {/* View Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '2rem',
          gap: '0.5rem'
        }} className="animate-fade-in stagger-3">
          <div style={{
            background: 'var(--bg-card)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex'
          }}>
            <button 
              onClick={() => handleToggle('list')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'list' ? '#07090e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                viewTransitionName: viewMode === 'list' ? 'history-toggle-pill' : 'none'
              }}
            >
              List View
            </button>
            <button 
              onClick={() => handleToggle('calendar')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'calendar' ? '#07090e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                viewTransitionName: viewMode === 'calendar' ? 'history-toggle-pill' : 'none'
              }}
            >
              Calendar Heatmap
            </button>
          </div>
        </div>
        
        <div style={{ maxWidth: viewMode === 'calendar' ? '900px' : '800px', margin: '0 auto' }} className="animate-fade-in stagger-4">
          {viewMode === 'list' ? (
            <RecentTransactions />
          ) : (
            <ExpenseCalendar />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

const AnalyticsPage = () => (
  <>
    <Header />
    <main className="container animate-fade-in" style={{ flex: 1 }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }} className="animate-fade-in stagger-1">
        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Analytics & Prediction</h2>
        <p>Analyze your spending patterns, forecast your month, and track your savings goals.</p>
      </div>

      <div className="animate-fade-in stagger-2">
        <MonthSelector />
      </div>

      {/* Zone 1 — Snapshot: side-by-side prediction + health score */}
      <div className="analytics-snapshot-grid animate-fade-in stagger-3">
        <PredictionEngine />
        <HealthScore />
      </div>

      {/* Zone 2 — Charts: expense breakdown + trend over time */}
      <div className="analytics-charts-grid animate-fade-in stagger-4">
        <ExpenseChart />
        <TrendChart />
      </div>

      {/* Zone 3 — Deep-dive: insights + savings goals side by side */}
      <div className="analytics-deep-grid animate-fade-in stagger-4">
        <FinancialInsights />
        <SavingsGoals />
      </div>
    </main>
    <Footer />
  </>
);

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAppContext();
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
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

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      // Set global mouse position relative to viewport
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
      
      // Update coordinates relative to each card for the localized spotlight effect
      const cards = document.querySelectorAll('.glass-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--card-mx', `${x}px`);
        card.style.setProperty('--card-my', `${y}px`);
      });
    };

    let lastScrollTop = 0;
    let scrollTimeout;
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      const diff = Math.min(Math.abs(st - lastScrollTop) * 2.5, 60); // Amplify stretching
      document.documentElement.style.setProperty('--scroll-stretch', `${100 + diff}%`);
      lastScrollTop = st <= 0 ? 0 : st;
      
      // Reset font stretch back to normal when scroll stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.documentElement.style.setProperty('--scroll-stretch', '100%');
      }, 120);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/ledger" element={
          <ProtectedRoute>
            <LedgerPage />
          </ProtectedRoute>
        } />
      </Routes>
      <PWAUpdateToast />
    </BrowserRouter>
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
