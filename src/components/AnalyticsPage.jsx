import Header from './Header';
import Footer from './Footer';
import MonthSelector from './MonthSelector';
import AnalyticsCarousel from './AnalyticsCarousel';
import PredictionEngine from './PredictionEngine';
import HealthScore from './HealthScore';
import ExpenseChart from './ExpenseChart';
import TrendChart from './TrendChart';
import FinancialInsights from './FinancialInsights';
import SavingsGoals from './SavingsGoals';

import MonthComparison from './MonthComparison';

const ANALYTICS_SLIDES = [
  {
    label: 'AI Prediction',
    icon: '🔮',
    content: <PredictionEngine />,
  },
  {
    label: 'Health Score',
    icon: '❤️',
    content: <HealthScore />,
  },
  {
    label: 'Expense Chart',
    icon: '🍩',
    content: <ExpenseChart />,
  },
  {
    label: '6-Month Trend',
    icon: '📈',
    content: <TrendChart />,
  },
  {
    label: 'Compare Months',
    icon: '📊',
    content: <MonthComparison />,
  },
  {
    label: 'Insights',
    icon: '💡',
    content: <FinancialInsights />,
  },
  {
    label: 'Savings Goals',
    icon: '🎯',
    content: <SavingsGoals />,
  },
];

const AnalyticsPage = () => (
  <>
    <Header />
    <main className="container animate-fade-in" style={{ flex: 1 }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }} className="animate-fade-in stagger-1">
        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Analytics & Prediction</h2>
        <p>Analyze your spending patterns, forecast your month, and track your savings goals.</p>
      </div>

      <div className="animate-fade-in stagger-2">
        <MonthSelector />
      </div>

      <div className="animate-fade-in stagger-3">
        <AnalyticsCarousel slides={ANALYTICS_SLIDES} />
      </div>
    </main>
    <Footer />
  </>
);

export default AnalyticsPage;
