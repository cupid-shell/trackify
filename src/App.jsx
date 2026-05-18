import React from 'react';
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

const Dashboard = () => (
  <>
    <Header />
    <main className="container">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Dashboard</h2>
        <p>Track your daily, monthly, and yearly expenses. Build your savings.</p>
      </div>

      <MonthSelector />
      
      <OverviewCards />

      <BudgetProgress />

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <TransactionForm />
      </div>
    </main>
  </>
);

const HistoryPage = () => (
  <>
    <Header />
    <main className="container">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Expense Log</h2>
        <p>View your complete transaction history.</p>
      </div>
      
      <MonthSelector />
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <RecentTransactions />
      </div>
    </main>
  </>
);

const AnalyticsPage = () => (
  <>
    <Header />
    <main className="container">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Analytics & Prediction</h2>
        <p>Analyze your spending and track your savings goals.</p>
      </div>
      
      <MonthSelector />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <PredictionEngine />
        <ExpenseChart />
        <TrendChart />
      </div>
    </main>
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
      </Routes>
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
