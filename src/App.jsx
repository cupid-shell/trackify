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

const Dashboard = () => (
  <>
    <Header />
    <main className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Dashboard</h2>
        <p>Track your daily, monthly, and yearly expenses. Build your savings.</p>
      </div>
      
      <OverviewCards />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        <style>{`
          @media (max-width: 768px) {
            div[style*="gridTemplateColumns: '1fr 2fr'"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        
        <div className="flex-col gap-6">
          <PredictionEngine />
          <TransactionForm />
        </div>
        
        <div className="flex-col gap-6">
          <ExpenseChart />
          <RecentTransactions />
        </div>
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
        <Route path="/login" element={
          <LoginRoute />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
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
