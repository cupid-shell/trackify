import { useAppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';

const MonthSelector = () => {
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useAppContext();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const displayDate = setYear(setMonth(new Date(), selectedMonth), selectedYear);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      backgroundColor: 'var(--bg-card)',
      padding: '0.75rem 1.5rem',
      borderRadius: 'var(--radius-full)',
      border: '1px solid var(--border-color)',
      marginBottom: '1.5rem',
      width: 'fit-content',
      margin: '0 auto 1.5rem auto'
    }}>
      <button 
        onClick={handlePrevMonth}
        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
      >
        <ChevronLeft size={20} />
      </button>
      
      <span style={{ fontWeight: 600, fontSize: '1rem', minWidth: '120px', textAlign: 'center' }}>
        {format(displayDate, 'MMMM yyyy')}
      </span>
      
      <button 
        onClick={handleNextMonth}
        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default MonthSelector;
