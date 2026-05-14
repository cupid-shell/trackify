import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Base configuration
  const baseIncome = 15000;
  
  const [savingsGoal, setSavingsGoal] = useState(() => {
    const saved = localStorage.getItem('trackify_goal');
    return saved ? JSON.parse(saved) : 3000;
  });

  useEffect(() => {
    localStorage.setItem('trackify_goal', JSON.stringify(savingsGoal));
  }, [savingsGoal]);

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchTransactions(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTransactions(session.user.id);
      else {
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTransactions = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const addTransaction = async (transaction) => {
    if (!session?.user) return;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newTx = { ...transaction, id: tempId, user_id: session.user.id };
    setTransactions(prev => [newTx, ...prev]);

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: session.user.id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          note: transaction.note,
          payment_method: transaction.payment_method || 'Cash'
        }
      ])
      .select()
      .single();

    if (!error && data) {
      // Replace temp id with real id
      setTransactions(prev => prev.map(tx => tx.id === tempId ? data : tx));
    } else {
      // Revert optimistic update on error
      setTransactions(prev => prev.filter(tx => tx.id !== tempId));
      alert('Error adding transaction: ' + error.message);
    }
  };

  const deleteTransaction = async (id) => {
    // Optimistic UI update
    const originalTransactions = [...transactions];
    setTransactions(prev => prev.filter(tx => tx.id !== id));

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      // Revert on error
      setTransactions(originalTransactions);
      alert('Error deleting transaction: ' + error.message);
    }
  };

  const updateSavingsGoal = (amount) => {
    setSavingsGoal(amount);
  };

  // Derived state for selected month/year filtering
  const currentRealDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentRealDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentRealDate.getFullYear());

  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
  });

  const totalAllowances = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalIncome = baseIncome + totalAllowances;

  const totalExpenses = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const balance = totalIncome - totalExpenses;

  const value = {
    session,
    transactions,
    baseIncome,
    savingsGoal,
    loading,
    addTransaction,
    deleteTransaction,
    updateSavingsGoal,
    currentMonthTransactions,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    totalIncome,
    totalExpenses,
    balance
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
