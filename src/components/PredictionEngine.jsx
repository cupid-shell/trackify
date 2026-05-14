import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

const PredictionEngine = () => {
  const { totalIncome, totalExpenses, savingsGoal, balance } = useAppContext();

  const prediction = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = totalDaysInMonth - currentDay;

    // Avoid division by zero
    const dailyBurnRate = currentDay > 0 ? totalExpenses / currentDay : 0;
    const projectedExpenses = totalExpenses + (dailyBurnRate * daysRemaining);
    const projectedBalance = totalIncome - projectedExpenses;
    
    const isOnTrack = projectedBalance >= savingsGoal;

    return {
      dailyBurnRate,
      projectedBalance,
      isOnTrack,
      daysRemaining
    };
  }, [totalExpenses, totalIncome, savingsGoal]);

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
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Projected End Balance</p>
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
          {prediction.isOnTrack 
            ? `Great job! You are on track to meet your savings goal of ৳${savingsGoal}.` 
            : `Warning: At your current spending rate, you will miss your ৳${savingsGoal} savings goal. Try to reduce daily spending.`}
        </p>
      </div>
    </div>
  );
};

export default PredictionEngine;
