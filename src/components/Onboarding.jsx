import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowRight, ArrowLeft, Check, Sparkles, Plus } from 'lucide-react';

const Onboarding = () => {
  const { updateSettings, showToast, userSettings } = useAppContext();
  const [step, setStep] = useState(1);
  const [baseIncome, setBaseIncome] = useState(15000);
  const [currency, setCurrency] = useState('BDT');
  const [savingsPercent, setSavingsPercent] = useState(20); // default 20%
  const [customSavings, setCustomSavings] = useState('');
  const [isCustomSavings, setIsCustomSavings] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([
    "Seat Rent",
    "Utility Bill",
    "Gas Bill (Cylinder)",
    "Personal Expenses",
    "Food & Dining",
    "Transport",
    "Other / Miscellaneous"
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const currencies = [
    { code: 'BDT', symbol: '৳', label: 'BDT (৳)' },
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
    { code: 'INR', symbol: '₹', label: 'INR (₹)' }
  ];

  const defaultCategoryOptions = [
    "Seat Rent",
    "Utility Bill",
    "Gas Bill (Cylinder)",
    "Personal Expenses",
    "Food & Dining",
    "Transport",
    "Education",
    "AI Subscription",
    "Entertainment",
    "Health & Medical",
    "Other / Miscellaneous"
  ];

  const handleCategoryToggle = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        showToast('Please select at least one category', 'warning');
        return;
      }
      setSelectedCategories(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    if (selectedCategories.includes(name)) {
      showToast('Category already exists', 'warning');
      return;
    }
    setSelectedCategories(prev => [...prev, name]);
    setNewCategoryName('');
    showToast(`Added custom category: ${name}`, 'success');
  };

  const calculatedSavingsGoal = isCustomSavings
    ? Number(customSavings) || 0
    : Math.round((baseIncome * savingsPercent) / 100);

  const handleCompleteSetup = async () => {
    try {
      const currentMetadata = { ...(userSettings.category_metadata || {}) };
      currentMetadata._onboarding_completed = true;
      currentMetadata._currency = currency;

      await updateSettings({
        base_income: Number(baseIncome),
        savings_goal: calculatedSavingsGoal,
        expense_categories: selectedCategories,
        currency: currency,
        category_metadata: currentMetadata
      });

      showToast('Welcome to Trackify! Your dashboard is ready.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error completing setup: ' + err.message, 'error');
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent), radial-gradient(circle at bottom left, rgba(62, 180, 137, 0.15), transparent), var(--bg-main)',
        padding: '1.5rem',
        color: 'var(--text-main)'
      }}
    >
      <div 
        className="glass-card flex-col"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid var(--border-color)',
          gap: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Progress Bar */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--border-color)',
            display: 'flex'
          }}
        >
          <div 
            style={{
              width: `${(step / 4) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Step 1: Welcome Screen */}
        {step === 1 && (
          <div className="flex-col items-center text-center gap-6 animate-fade-in">
            <div 
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px var(--primary-glow)',
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              <Sparkles size={36} color="white" />
            </div>
            
            <div className="flex-col gap-2">
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Welcome to <span style={{ color: 'var(--primary)' }}>Trackify</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
                Take control of your spending, track debts, and build consistent savings habits. Let's customize your profile in 3 quick steps.
              </p>
            </div>

            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-input)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.87rem',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                width: '100%'
              }}
            >
              <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ textAlign: 'left' }}>Your data is securely stored in your personal Supabase account.</span>
            </div>

            <button 
              className="grid-submit-btn"
              onClick={nextStep}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Let's Begin
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Income & Currency */}
        {step === 2 && (
          <div className="flex-col gap-6 animate-fade-in">
            <div className="flex-col gap-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Step 1 of 3</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Income & Currency</h2>
              <p style={{ color: 'var(--text-muted)' }}>Configure your primary monthly income and preferred currency display.</p>
            </div>

            <div className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Preferred Currency</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem' }}>
                  {currencies.map(curr => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setCurrency(curr.code)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: currency === curr.code ? 'var(--primary-glow)' : 'var(--bg-input)',
                        border: `1px solid ${currency === curr.code ? 'var(--primary)' : 'var(--border-color)'}`,
                        color: currency === curr.code ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      {curr.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-col gap-2">
                <label htmlFor="base-income" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Estimated Monthly Income ({currency})
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span 
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600
                    }}
                  >
                    {currencies.find(c => c.code === currency)?.symbol || '$'}
                  </span>
                  <input
                    id="base-income"
                    type="number"
                    value={baseIncome}
                    onChange={(e) => setBaseIncome(Math.max(0, Number(e.target.value)))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '1.125rem',
                      fontWeight: 600
                    }}
                    placeholder="Enter monthly income"
                  />
                </div>
                <input 
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={baseIncome}
                  onChange={(e) => setBaseIncome(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary)',
                    marginTop: '0.5rem',
                    cursor: 'pointer'
                  }}
                />
                <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Min: 5K</span>
                  <span>Max: 150K</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4" style={{ marginTop: '1rem' }}>
              <button 
                className="grid-add-btn" 
                onClick={prevStep}
                style={{ flex: 1, margin: 0, justifyContent: 'center' }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button 
                className="grid-submit-btn" 
                onClick={nextStep}
                style={{ flex: 2, margin: 0, justifyContent: 'center' }}
              >
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Savings Goals */}
        {step === 3 && (
          <div className="flex-col gap-6 animate-fade-in">
            <div className="flex-col gap-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Step 2 of 3</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Monthly Savings Goal</h2>
              <p style={{ color: 'var(--text-muted)' }}>How much of your income do you want to save each month?</p>
            </div>

            <div className="flex-col gap-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {[10, 20, 30].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setSavingsPercent(pct);
                      setIsCustomSavings(false);
                    }}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: (!isCustomSavings && savingsPercent === pct) ? 'var(--primary-glow)' : 'var(--bg-input)',
                      border: `1px solid ${(!isCustomSavings && savingsPercent === pct) ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: (!isCustomSavings && savingsPercent === pct) ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    {pct}% {pct === 20 && '(Recommended)'}
                  </button>
                ))}
              </div>

              <div 
                onClick={() => setIsCustomSavings(true)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCustomSavings ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                  border: `1px dashed ${isCustomSavings ? 'var(--primary)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="custom-savings-radio" 
                    checked={isCustomSavings} 
                    onChange={() => setIsCustomSavings(true)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="custom-savings-radio" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Or Set Custom Amount
                  </label>
                </div>
                {isCustomSavings && (
                  <input
                    type="number"
                    value={customSavings}
                    onChange={(e) => setCustomSavings(Math.max(0, Number(e.target.value)))}
                    placeholder={`e.g. 5000`}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  />
                )}
              </div>

              {/* Dynamic Summary Card */}
              <div 
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-glow)',
                  border: '1px solid rgba(62, 180, 137, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  marginTop: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Target Savings Summary</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {currencies.find(c => c.code === currency)?.symbol || '৳'}{calculatedSavingsGoal.toLocaleString()} / month
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This is {isCustomSavings ? Math.round((calculatedSavingsGoal / baseIncome) * 100) || 0 : savingsPercent}% of your monthly income. Remaining BDT {(baseIncome - calculatedSavingsGoal).toLocaleString()} is allocated for your spending budget limit.
                </span>
              </div>
            </div>

            <div className="flex gap-4" style={{ marginTop: '1rem' }}>
              <button 
                className="grid-add-btn" 
                onClick={prevStep}
                style={{ flex: 1, margin: 0, justifyContent: 'center' }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button 
                className="grid-submit-btn" 
                onClick={nextStep}
                style={{ flex: 2, margin: 0, justifyContent: 'center' }}
              >
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Expense Categories */}
        {step === 4 && (
          <div className="flex-col gap-6 animate-fade-in">
            <div className="flex-col gap-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Step 3 of 3</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Expense Categories</h2>
              <p style={{ color: 'var(--text-muted)' }}>Select the expense categories you'd like to track. You can toggle default options or add your own.</p>
            </div>

            <div className="flex-col gap-4">
              {/* Category Options Grid */}
              <div 
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  padding: '4px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)'
                }}
              >
                {defaultCategoryOptions.map(cat => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      {isSelected && <Check size={12} />}
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Category Form */}
              <form onSubmit={handleAddCustomCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Add custom category name..."
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  type="submit"
                  className="grid-add-btn"
                  style={{
                    padding: '0.5rem 1rem',
                    margin: 0,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  <Plus size={14} />
                  Add
                </button>
              </form>

              {/* Active list summary */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Active Categories ({selectedCategories.length}): {selectedCategories.slice(0, 4).join(', ')} {selectedCategories.length > 4 && 'and ' + (selectedCategories.length - 4) + ' more.'}
              </div>
            </div>

            <div className="flex gap-4" style={{ marginTop: '1rem' }}>
              <button 
                className="grid-add-btn" 
                onClick={prevStep}
                style={{ flex: 1, margin: 0, justifyContent: 'center' }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button 
                className="grid-submit-btn" 
                onClick={handleCompleteSetup}
                style={{ flex: 2, margin: 0, justifyContent: 'center' }}
              >
                <Sparkles size={16} />
                Finish Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
