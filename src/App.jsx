import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
        {/* Left Column: Transaction Input */}
        <div style={{ width: '100%' }}>
          <TransactionForm />
        </div>

        {/* Right Column: Status & Checklists */}
        <div className="flex-col gap-6" style={{ width: '100%' }}>
          <BudgetProgress />
          <RecurringTracker />
        </div>
      </div>
    </main>
    <Footer />
  </>
);

const HistoryPage = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

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
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'list' ? '#07090e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
            >
              List View
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'calendar' ? '#07090e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
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
        <p>Analyze your spending and track your savings goals.</p>
      </div>
      
      <div className="animate-fade-in stagger-2">
        <MonthSelector />
      </div>

      <div className="analytics-grid animate-fade-in stagger-3">
        {/* Left Column: Insights & Prediction */}
        <div className="flex-col gap-6" style={{ width: '100%' }}>
          <PredictionEngine />
          <FinancialInsights />
          <HealthScore />
        </div>

        {/* Right Column: Charts & Trends */}
        <div className="flex-col gap-6" style={{ width: '100%' }}>
          <SavingsGoals />
          <ExpenseChart />
          <TrendChart />
        </div>
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
