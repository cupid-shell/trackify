import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, TrendingUp, Calendar as CalendarIcon, Info, Flame, Award, ShieldCheck } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

const ExpenseCalendar = ({ selectedDay = null, setSelectedDay = null }) => {
  const { 
    currentMonthTransactions, 
    selectedMonth, 
    selectedYear,
    getCategoryStyle
  } = useAppContext();
  
  const [localSelectedDay, setLocalSelectedDay] = useState(null);

  // Month details
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const firstDayIndex = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  }, [selectedMonth, selectedYear]);
  
  // Group transactions of the current month by day
  const dailyData = useMemo(() => {
    const data = {};
    for (let i = 1; i <= daysInMonth; i++) {
      data[i] = {
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
          data[day].expenses.push(tx);
          data[day].totalExpense += Number(tx.amount);
        } else if (tx.type === 'income') {
          data[day].income.push(tx);
          data[day].totalIncome += Number(tx.amount);
        }
      }
    });

    return data;
  }, [currentMonthTransactions, daysInMonth]);

  // Find max daily expense to scale heatmap intensity
  const maxDailyExpense = useMemo(() => {
    let max = 0;
    Object.values(dailyData).forEach(day => {
      if (day.totalExpense > max) {
        max = day.totalExpense;
      }
    });
    return max;
  }, [dailyData]);

  // Streak & No Spend Days Analytics
  const noSpendCount = useMemo(() => {
    return Object.values(dailyData).filter(day => day.totalExpense === 0).length;
  }, [dailyData]);

  const streakInfo = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const checkUpToDay = isCurrentMonth ? today.getDate() : daysInMonth;
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    for (let d = 1; d <= checkUpToDay; d++) {
      if (dailyData[d].totalExpense === 0) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    
    // Calculate current streak backwards from checkUpToDay
    for (let d = checkUpToDay; d >= 1; d--) {
      if (dailyData[d].totalExpense === 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return { maxStreak, currentStreak };
  }, [dailyData, selectedMonth, selectedYear, daysInMonth]);

  const activeDay = setSelectedDay ? selectedDay : localSelectedDay;

  const getHeatmapStyle = (dayInfo, isActive) => {
    if (dayInfo.totalExpense === 0) {
      return {
        background: 'rgba(16, 185, 129, 0.015)',
        border: `1px solid ${isActive ? 'var(--primary)' : 'rgba(16, 185, 129, 0.12)'}`,
        boxShadow: isActive 
          ? '0 0 14px var(--primary-glow), inset 0 0 4px rgba(16, 185, 129, 0.05)' 
          : 'inset 0 0 3px rgba(16, 185, 129, 0.01)',
        color: 'var(--success)'
      };
    }
    
    const ratio = maxDailyExpense > 0 ? dayInfo.totalExpense / maxDailyExpense : 0;
    
    let baseColor;
    let bgOpacity;
    let borderOpacity;
    let glow = 'none';

    if (ratio < 0.25) {
      baseColor = '99, 102, 241'; // Cyber Blue/Purple
      bgOpacity = 0.08;
      borderOpacity = 0.25;
    } else if (ratio < 0.70) {
      baseColor = '244, 63, 94'; // Cyber Rose
      bgOpacity = 0.26;
      borderOpacity = 0.45;
    } else {
      baseColor = '239, 68, 68'; // Neon Crimson
      bgOpacity = 0.62;
      borderOpacity = 0.85;
      glow = '0 0 12px rgba(239, 68, 68, 0.22)';
    }

    if (isActive) {
      return {
        background: `rgba(${baseColor}, ${Math.min(0.9, bgOpacity + 0.18)})`,
        border: '2px solid var(--primary)',
        boxShadow: `0 0 16px var(--primary-glow), ${glow}`,
        color: '#fff',
        zIndex: 5
      };
    }

    return {
      background: `rgba(${baseColor}, ${bgOpacity})`,
      border: `1px solid rgba(${baseColor}, ${borderOpacity})`,
      boxShadow: glow,
      color: ratio >= 0.7 ? '#ffffff' : `rgb(${baseColor})`
    };
  };

  const handleDayClick = (dayNumber) => {
    if (setSelectedDay) {
      if (selectedDay === dayNumber) {
        setSelectedDay(null);
      } else {
        setSelectedDay(dayNumber);
      }
    } else {
      if (localSelectedDay === dayNumber) {
        setLocalSelectedDay(null);
      } else {
        setLocalSelectedDay(dayNumber);
      }
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar cells generation
  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayInfo = dailyData[day];
    const isActive = activeDay === day;
    const style = getHeatmapStyle(dayInfo, isActive);
 
    cells.push(
      <div
        key={`day-${day}`}
        onClick={() => handleDayClick(day)}
        style={style}
        className={`calendar-day-cell ${isActive ? 'active-cell' : ''}`}
      >
        <span className="calendar-day-cell-number" style={{ color: isActive ? '#fff' : 'var(--text-muted)' }}>{day}</span>
        {dayInfo.totalExpense > 0 ? (
          <span className="calendar-day-cell-amount" style={{ color: isActive ? '#fff' : undefined }}>
            ৳{Math.round(dayInfo.totalExpense).toLocaleString('en-IN')}
          </span>
        ) : (
          <div className="calendar-day-cell-win" title="Savings day win!">
            <span>WIN</span>
          </div>
        )}
      </div>
    );
  }

  const formattedSelectedDate = activeDay 
    ? `${monthNames[selectedMonth]} ${activeDay}, ${selectedYear}`
    : '';

  // Fallback modal handling (only when not integrated as inline filter)
  const showModal = !setSelectedDay && localSelectedDay !== null;
  const modalTransactions = localSelectedDay ? [...dailyData[localSelectedDay].expenses, ...dailyData[localSelectedDay].income] : [];

  return (
    <div className="glass-card expense-calendar-card flex-col gap-0" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(255,255,255,0.01) 100%)' }}>
      <style>{`
        .calendar-scroll-container {
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          margin-top: 1rem;
          padding: 4px 4px 8px 4px;
        }
        @media (min-width: 640px) {
          .calendar-scroll-container {
            overflow: visible;
          }
        }
        .calendar-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(42px, 1fr));
          gap: 0.55rem;
          min-width: 320px;
        }
        .weekday-header {
          text-align: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          padding-bottom: 0.4rem;
          border-bottom: 1px solid var(--border-color);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .calendar-cell.empty {
          background: transparent;
          border: 1px dashed rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          aspect-ratio: 1.15/1;
          pointer-events: none;
        }
        .calendar-day-cell {
          cursor: pointer;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 0.45rem 0.5rem;
          aspect-ratio: 1.15/1;
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .calendar-day-cell:hover {
          transform: translateY(-2px) scale(1.06);
          filter: brightness(1.15);
          z-index: 10;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5) !important;
        }
        .calendar-day-cell-number {
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1;
        }
        .calendar-day-cell-amount {
          font-size: 0.65rem;
          font-family: 'Hubot Sans Variable', monospace;
          font-weight: 700;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: auto;
        }
        .calendar-day-cell-win {
          font-size: 0.55rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: var(--success);
          text-shadow: 0 0 6px rgba(16, 185, 129, 0.45);
          background: rgba(16, 185, 129, 0.08);
          padding: 0.05rem 0.25rem;
          border-radius: 4px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          width: fit-content;
          align-self: flex-end;
          margin-top: auto;
          line-height: 1.2;
        }

        @media (max-width: 640px) {
          .expense-calendar-card {
            padding: 0.75rem 0.5rem !important;
          }
          .calendar-grid {
            grid-template-columns: repeat(7, minmax(30px, 1fr)) !important;
            gap: 0.25rem !important;
            min-width: 0 !important;
          }
          .calendar-day-cell {
            padding: 0.3rem 0.25rem !important;
          }
          .calendar-day-cell-number {
            font-size: 0.68rem !important;
          }
          .calendar-day-cell-amount {
            font-size: 0.55rem !important;
          }
          .calendar-day-cell-win {
            font-size: 0.5rem !important;
            padding: 0.02rem 0.15rem !important;
          }
        }
      `}</style>

      {/* Heatmap Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={16} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 4px var(--primary-glow))' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Monthly Spend Calendar</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.2)' }} />
            <span>Savings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }} />
            <span>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(244, 63, 94, 0.26)', border: '1px solid rgba(244, 63, 94, 0.45)' }} />
            <span>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.62)', border: '1px solid rgba(239, 68, 68, 0.85)' }} />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Heatmap Insights Dashboard */}
      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginTop: '0.65rem', width: '100%', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: '95px', padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} color="var(--success)" style={{ filter: 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.3))' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>Saving Wins</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--success)' }}>{noSpendCount} / {daysInMonth} d</span>
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: '95px', padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Flame size={14} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 3px var(--primary-glow))' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>Active Streak</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{streakInfo.currentStreak} Days</span>
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: '95px', padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={14} color="var(--warning)" style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.3))' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>Max Streak</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--warning)' }}>{streakInfo.maxStreak} Days</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-scroll-container">
        <div className="calendar-grid">
          {weekdays.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
          {cells}
        </div>
      </div>

      {/* Legacy Fallback modal (only used when setSelectedDay is not provided) */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 17, 21, 0.85)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '500px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', padding: 0,
            overflow: 'hidden', border: '1px solid var(--border-color)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Daily Audit</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formattedSelectedDate}</span>
              </div>
              <button 
                onClick={() => {
                  setLocalSelectedDay(null);
                }}
                style={{
                  padding: '0.5rem', borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {modalTransactions.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '2rem 1rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--success)'
                  }}>
                    <Info size={24} />
                  </div>
                  <h4 style={{ margin: 0 }}>No-Spend Day!</h4>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>You logged zero expenses and saved your money today. Keep it up!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {modalTransactions.map((tx, idx) => {
                    const isExpense = tx.type === 'expense';
                    return (
                      <div 
                        key={tx.id || idx}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
                            background: isExpense ? `${getCategoryStyle(tx.category).color}15` : 'rgba(16, 185, 129, 0.1)',
                            border: `1px solid ${isExpense ? `${getCategoryStyle(tx.category).color}30` : 'rgba(16, 185, 129, 0.2)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: isExpense ? '1.125rem' : '0.9rem', flexShrink: 0
                          }}>
                            {isExpense ? <CategoryIcon category={tx.category} size={18} /> : <TrendingUp size={18} style={{ color: 'var(--success)' }} />}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tx.note || tx.category}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                              <span style={{ 
                                color: isExpense ? getCategoryStyle(tx.category).color : 'var(--success)', 
                                fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                              }}>
                                {isExpense && <CategoryIcon category={tx.category} size={12} />}
                                {tx.category}
                              </span>
                              <span>•</span>
                              <span>{tx.payment_method || 'Cash'}</span>
                              <span>•</span>
                              <span>{new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 'bold', color: isExpense ? 'var(--danger)' : 'var(--success)' }}>
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
              padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              <button 
                onClick={() => {
                  setLocalSelectedDay(null);
                }}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)', color: '#ffffff',
                  fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer'
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
