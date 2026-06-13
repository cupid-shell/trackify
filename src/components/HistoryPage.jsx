import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MonthSelector from './MonthSelector';
import ExpenseCalendar from './ExpenseCalendar';
import RecentTransactions from './RecentTransactions';

const HistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDay = searchParams.get('day') !== null ? Number(searchParams.get('day')) : null;
  const setSelectedDay = (day) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (day === null) {
        next.delete('day');
      } else {
        next.set('day', day.toString());
      }
      return next;
    }, { replace: true });
  };

  const searchTerm = searchParams.get('q') || '';
  const setSearchTerm = (val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!val) {
        next.delete('q');
      } else {
        next.set('q', val);
      }
      return next;
    }, { replace: true });
  };

  const selectedCategory = searchParams.get('cat') || 'All';
  const setSelectedCategory = (val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val === 'All') {
        next.delete('cat');
      } else {
        next.set('cat', val);
      }
      return next;
    }, { replace: true });
  };

  const startDate = searchParams.get('from') || '';
  const setStartDate = (val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!val) {
        next.delete('from');
      } else {
        next.set('from', val);
      }
      return next;
    }, { replace: true });
  };

  const endDate = searchParams.get('to') || '';
  const setEndDate = (val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!val) {
        next.delete('to');
      } else {
        next.set('to', val);
      }
      return next;
    }, { replace: true });
  };

  return (
    <>
      <Header />
      <main className="container animate-fade-in" style={{ flex: 1 }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }} className="animate-fade-in stagger-1">
          <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Expense Log</h2>
          <p>View your complete transaction history.</p>
        </div>
        
        <div className="animate-fade-in stagger-2" style={{ marginBottom: '2rem' }}>
          <MonthSelector />
        </div>

        <div className="flex-col gap-8 animate-fade-in stagger-3" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <ExpenseCalendar selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
          <RecentTransactions 
            selectedDay={selectedDay} 
            setSelectedDay={setSelectedDay}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HistoryPage;
