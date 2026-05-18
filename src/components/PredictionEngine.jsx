import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

const PredictionEngine = () => {
  const { totalIncome, totalExpenses, savingsGoal, currentMonthTransactions, selectedMonth, selectedYear } = useAppContext();

  const prediction = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const isPastMonth = new Date(selectedYear, selectedMonth, 1) < new Date(today.getFullYear(), today.getMonth(), 1);
    
    const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const currentDay = isCurrentMonth ? today.getDate() : totalDaysInMonth;
    const daysRemaining = isCurrentMonth ? totalDaysInMonth - currentDay : 0;

    const knownFixed = ['Rent', 'Utilities & Bills', 'Education'];
    const knownVariable = ['Daily Living', 'Food & Dining', 'Transport', 'Other / Unexpected'];
    
    let variableExpensesSum = 0;
    
    currentMonthTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        if (knownFixed.includes(tx.category)) return;
        
        if (knownVariable.includes(tx.category)) {
          variableExpensesSum += Number(tx.amount);
        } else {
          // Smart heuristic: Include custom categories in daily burn only if they are < 1000 BDT.
          // Large purchases (like a 5000 BDT keyboard) shouldn't be extrapolated daily.
          if (Number(tx.amount) < 1000) {
            variableExpensesSum += Number(tx.amount);
          }
        }
      }
    });

    // Avoid division by zero
    const dailyBurnRate = currentDay > 0 ? variableExpensesSum / currentDay : 0;
    
    // Project end balance based on daily burn rate for the REST of the month
    const projectedExpenses = totalExpenses + (dailyBurnRate * daysRemaining);
    const projectedBalance = totalIncome - projectedExpenses;
    
    const isOnTrack = projectedBalance >= savingsGoal;

    return {
      dailyBurnRate,
      projectedBalance: isPastMonth ? (totalIncome - totalExpenses) : projectedBalance,
      isOnTrack,
      daysRemaining,
      isPastMonth
    };
  }, [totalExpenses, totalIncome, savingsGoal, currentMonthTransactions, selectedMonth, selectedYear]);

  return (
    <div className="glass-card flex-col gap-4" style={{ 
      background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.2)'
    }}>
      <div className="flex items-center gap-2">
        <Sparkles size={20} color="var(--primary)" />
        <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>AI Prediction</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Average Daily Spend</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>৳{prediction.dailyBurnRate.toFixed(0)}/day</p>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{prediction.isPastMonth ? 'Final Balance' : 'Projected End Balance'}</p>
          <p style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)'
          }}>
            ৳{prediction.projectedBalance.toFixed(0)}
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '0.5rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: prediction.isOnTrack ? 'var(--success-bg)' : 'var(--danger-bg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem'
      }}>
        {prediction.isOnTrack ? (
          <CheckCircle size={18} color="var(--success)" style={{ marginTop: '2px' }} />
        ) : (
          <AlertTriangle size={18} color="var(--danger)" style={{ marginTop: '2px' }} />
        )}
        <p style={{ fontSize: '0.875rem', color: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)' }}>
          {prediction.isPastMonth 
            ? (prediction.isOnTrack ? `Goal achieved! You saved at least ৳${savingsGoal}.` : `You missed your minimum ৳${savingsGoal} savings goal.`)
            : (prediction.isOnTrack ? `Great job! You are on track to save at least ৳${savingsGoal} this month.` : `Warning: At your current spending rate, you will miss your minimum ৳${savingsGoal} savings goal. Try to reduce daily spending.`)}
        </p>
      </div>
    </div>
  );
};

export default PredictionEngine;
