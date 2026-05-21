import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, TrendingUp, TrendingDown, Calendar as CalendarIcon, Info } from 'lucide-react';

const ExpenseCalendar = () => {
  const { 
    currentMonthTransactions, 
    selectedMonth, 
    selectedYear 
  } = useAppContext();
  
  const [selectedDayTransactions, setSelectedDayTransactions] = useState(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState(null);

  // Month details
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Group transactions of the current month by day
  const dailyData = {};
  for (let i = 1; i <= daysInMonth; i++) {
    dailyData[i] = {
      expenses: [],
      income: [],
      totalExpense: 0,
      totalIncome: 0
    };
  }

  currentMonthTransactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const day = txDate.getDate();
    if (day >= 1 && day <= daysInMonth) {
      if (tx.type === 'expense') {
        dailyData[day].expenses.push(tx);
        dailyData[day].totalExpense += Number(tx.amount);
      } else if (tx.type === 'income') {
        dailyData[day].income.push(tx);
        dailyData[day].totalIncome += Number(tx.amount);
      }
    }
  });

  // Find max daily expense to scale heatmap intensity
  let maxDailyExpense = 0;
  Object.values(dailyData).forEach(day => {
    if (day.totalExpense > maxDailyExpense) {
      maxDailyExpense = day.totalExpense;
    }
  });

  const getHeatmapStyle = (dayInfo) => {
    if (dayInfo.totalExpense === 0) {
      return {
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        color: '#10b981'
      };
    }
    
    // Scale intensity: opacity ranges from 0.15 (low expense) to 0.85 (max expense)
    const ratio = maxDailyExpense > 0 ? dayInfo.totalExpense / maxDailyExpense : 0;
    const opacity = 0.15 + ratio * 0.70;
    
    return {
      background: `rgba(239, 68, 68, ${opacity})`,
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#ffffff',
      boxShadow: ratio > 0.7 ? '0 0 10px rgba(239, 68, 68, 0.25)' : 'none'
    };
  };

  const handleDayClick = (dayNumber) => {
    const dayInfo = dailyData[dayNumber];
    const allTxs = [...dayInfo.expenses, ...dayInfo.income];
    if (allTxs.length > 0) {
      setSelectedDayTransactions(allTxs);
      setSelectedDayNumber(dayNumber);
    } else {
      // Allow showing empty no-spend message if clicked
      setSelectedDayTransactions([]);
      setSelectedDayNumber(dayNumber);
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar cells generation
  const cells = [];
  // Prefix cells for empty days before start of month
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty" style={{ opacity: 0.15 }} />);
  }

  // Actual day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayInfo = dailyData[day];
    const hasTransactions = dayInfo.expenses.length > 0 || dayInfo.income.length > 0;
    const style = getHeatmapStyle(dayInfo);

    cells.push(
      <div
        key={`day-${day}`}
        onClick={() => handleDayClick(day)}
        style={{
          ...style,
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '0.5rem',
          aspectRatio: '1/1',
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="calendar-day-cell"
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{day}</span>
        {dayInfo.totalExpense > 0 && (
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            textAlign: 'right',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            ৳{dayInfo.totalExpense}
          </span>
        )}
        {dayInfo.totalExpense === 0 && (
          <span style={{ 
            fontSize: '0.6rem', 
            opacity: 0.8,
            textAlign: 'right',
            fontWeight: 'normal'
          }}>
            No spend
          </span>
        )}
      </div>
    );
  }

  const formattedSelectedDate = selectedDayNumber 
    ? `${monthNames[selectedMonth]} ${selectedDayNumber}, ${selectedYear}`
    : '';

  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
      <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .weekday-header {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .calendar-day-cell:hover {
          transform: translateY(-2px);
          filter: brightness(1.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>

      {/* Heatmap Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={18} className="text-primary" style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Monthly Expense Heatmap</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }} />
            <span>No Spend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
            <span>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.5)', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
            <span>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.85)', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {weekdays.map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
        {cells}
      </div>

      {/* Transaction Modal Overlay */}
      {selectedDayTransactions !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 17, 21, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Daily Audit</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formattedSelectedDate}</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedDayTransactions(null);
                  setSelectedDayNumber(null);
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-muted)'
                }}
                className="hover-action"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              {selectedDayTransactions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)'
                  }}>
                    <Info size={24} />
                  </div>
                  <h4 style={{ margin: 0 }}>No-Spend Day!</h4>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>You logged zero expenses and saved your money today. Keep it up!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedDayTransactions.map((tx, idx) => {
                    const isExpense = tx.type === 'expense';
                    return (
                      <div 
                        key={tx.id || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-full)',
                            background: isExpense ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isExpense ? 'var(--danger)' : 'var(--success)',
                            flexShrink: 0
                          }}>
                            {isExpense ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tx.note || tx.category}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              <span>{tx.category}</span>
                              <span>•</span>
                              <span>{tx.payment_method || 'Cash'}</span>
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontWeight: 'bold',
                          color: isExpense ? 'var(--danger)' : 'var(--success)'
                        }}>
                          {isExpense ? '-' : '+'}৳{tx.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              <button 
                onClick={() => {
                  setSelectedDayTransactions(null);
                  setSelectedDayNumber(null);
                }}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCalendar;
