import React from 'react';
import Header from './components/Header';
import OverviewCards from './components/OverviewCards';
import TransactionForm from './components/TransactionForm';
import RecentTransactions from './components/RecentTransactions';
import ExpenseChart from './components/ExpenseChart';
import PredictionEngine from './components/PredictionEngine';

function App() {
  return (
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
          {/* We'll use CSS to make this responsive, but for now inline grid */}
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
}

export default App;
