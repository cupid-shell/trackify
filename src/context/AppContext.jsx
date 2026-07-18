import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { version as currentVersion } from '../../package.json';
import { X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { isVersionNewer } from '../utils/version';
import { parseLocalDate } from '../utils/date';
import { filterByMonth, computeMonthTotals, computeRollovers } from '../utils/finance';
import { mapSettingsRow, readSkippedBills } from '../utils/settingsMapping';
import { readCache, writeCache, clearCache, cacheSyncedAt } from '../utils/offlineCache';

const AppContext = createContext();

// Transient registry for undoable transaction deletes: id -> { tx, timer }.
// Kept at module scope (not a React ref) so it stays out of the compiler's
// render/immutability analysis; there is only one AppProvider, so sharing is safe.
const pendingTxDeletes = {};

// Remembers who was last signed in on this device, so a boot can tell
// "signed out" apart from "offline and the token could not be refreshed"
// before auth resolves. Not user-scoped, by design — it is the pointer.
const LAST_USER_ID_KEY = 'trackify_last_user_id';

// Read once at module load, outside render, so it can seed state without
// tripping the React Compiler's purity rule.
const bootLastUserId = (() => {
  try {
    return localStorage.getItem(LAST_USER_ID_KEY);
  } catch {
    return null;
  }
})();

// navigator.onLine only ever proves you're *disconnected*; a true value still
// lies behind captive portals. Treated as a hint — a successful request is the
// real liveness proof.
const initialOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;

// Last-synced snapshot, read ONCE at module load. Module scope (not a ref, not
// an effect) for two reasons: it happens before first paint so there is no empty
// frame, and it keeps a localStorage read out of render, which the React
// Compiler's purity rule would otherwise flag.
//
// The cache is applied only in the lazy initializers below — never after the
// first render. That is what makes "stale cache clobbers fresh server data"
// impossible by construction: the server always overwrites wholesale.
const bootCache = readCache(bootLastUserId);

// Who the loaded data currently belongs to. Module scope (like pendingTxDeletes)
// so mutating it stays outside the compiler's render analysis. Needed because a
// SIGNED_OUT event carries no session, so it can't tell us whose cache to clear.
let activeUserId = bootLastUserId;

const writeLastUserId = (userId) => {
  try {
    if (userId) localStorage.setItem(LAST_USER_ID_KEY, userId);
  } catch {
    // Storage unavailable (private mode / quota). Non-fatal: the app still
    // works online, it just can't recognise the user on an offline boot.
  }
};

// Re-exported so the many components that import it from this context keep working.
// eslint-disable-next-line react-refresh/only-export-components
export { parseLocalDate };

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);

const defaultPresets = [
  { label: '৳15 Bus', amount: 15, category: 'Transport', note: 'Bus fare', payment: 'Cash' },
  { label: '৳50 Snack', amount: 50, category: 'Food & Dining', note: 'Snacks', payment: 'Cash' },
  { label: '৳120 Lunch', amount: 120, category: 'Food & Dining', note: 'Lunch', payment: 'Cash' },
  { label: '৳100 Mobile', amount: 100, category: 'Utilities & Bills', note: 'Mobile recharge', payment: 'bKash' }
];

const defaultRecurringBills = [
  { name: 'Home WiFi Bill', amount: 525, category: 'Utilities & Bills', dueDate: 20, payment: 'bKash' },
  { name: 'Seat Rent', amount: 3000, category: 'Rent', dueDate: 5, payment: 'Cash' }
];

const defaultNotificationPrefs = {
  daily_reminder: true,
  daily_reminder_time: '21:30',
  weekly_digest: true,
  weekly_digest_day: 'Saturday',
  budget_alerts: true,
  budget_threshold: '85',
  savings_milestones: true,
  bill_reminders: true,
  spend_spike_alerts: true,
  monthly_review: true,
  zero_spend_streak: true,
  budget_exhaustion: true,
  weekly_savings_motivation: true
};

// Union of every payment method that used to be hardcoded across the app, in a
// sensible order for the BD user. Stored per-user in category_metadata
// (._payment_methods) so it needs no DB schema change; this is the fallback.
const DEFAULT_PAYMENT_METHODS = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Card', 'Bank'];

const defaultSettings = {
  base_income: 15000,
  savings_goal: 3000,
  expense_categories: ["Seat Rent", "Utility Bill", "Gas Bill (Cylinder)", "Personal Expenses", "Food & Dining", "Transport", "Other / Miscellaneous"],
  income_categories: ["Allowance", "Bonus", "Other"],
  category_budgets: {},
  savings_goals: [],
  category_metadata: {},
  presets: defaultPresets,
  recurring_bills: defaultRecurringBills,
  notification_preferences: defaultNotificationPrefs,
  currency: 'BDT'
};

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState(() => bootCache?.transactions?.rows || []);
  const [debts, setDebts] = useState(() => bootCache?.debts?.rows || []);
  // `bootstrapped` = the first full load attempt has finished (succeeded OR
  // failed). It replaces the old `loading` flag, which each fetch toggled
  // independently — so whichever finished first cleared it while the others were
  // still in flight. refreshAll is now the single writer.
  const [bootstrapped, setBootstrapped] = useState(false);
  // One object so a sync transition re-renders consumers once, not per-field.
  // lastSyncedAt is seeded from the cache so an offline boot can say how old
  // what you're looking at actually is.
  const [syncState, setSyncState] = useState({
    syncing: false,
    lastSyncedAt: cacheSyncedAt(bootCache),
    lastError: null,
    txFailed: false,
  });
  // Whether this render started from cached data. Drives `loading` so a cached
  // boot paints immediately instead of sitting on the splash screen.
  const hydratedFromCache = bootCache !== null;
  const [isOnline, setIsOnline] = useState(initialOnline);
  // Whether someone was signed in on this device before this boot. Lets an
  // offline boot with an unrefreshable token show an honest "you're offline"
  // screen instead of a sign-in form that cannot possibly work.
  const [wasSignedIn, setWasSignedIn] = useState(() => bootLastUserId !== null);
  const loading = !bootstrapped && !hydratedFromCache;
  // Tracks whether a user_settings row was positively found in the database.
  // null = unknown/not yet confirmed (e.g. fetch in flight or failed),
  // true = an existing row was loaded, false = confirmed no row (genuinely new user).
  // Used to prevent returning users from ever being shown new-user onboarding
  // after a transient session/network hiccup.
  const [settingsRowExists, setSettingsRowExists] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
    checkbox: null,
    onConfirm: () => {}
  });
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // Theme mode: dark or light
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('trackify_theme_mode') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('trackify_theme_mode', themeMode);
    if (themeMode === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [themeMode]);

  // toggleThemeMode moved below updateSettings to avoid TDZ

  const showToast = useCallback((message, type = 'success', options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { action = null, duration = 3500 } = options;
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const showConfirm = useCallback(({ title, message, confirmLabel, cancelLabel, variant, checkbox, onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: confirmLabel || 'Confirm',
      cancelLabel: cancelLabel || 'Cancel',
      variant: variant || 'danger',
      checkbox: checkbox || null,
      onConfirm: (checkboxChecked) => {
        onConfirm(checkboxChecked);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const dismissUpdate = useCallback((permanently = false) => {
    if (permanently && updateAvailable) {
      localStorage.setItem('trackify_ignored_update_version', updateAvailable.version);
    }
    setUpdateDismissed(true);
  }, [updateAvailable]);
  
  // Initialize dynamic theme accent on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('trackify_theme') || 'emerald';
    const themes = {
      mint: { primary: '#3eb489', hover: '#2e9b73', glow: 'rgba(62, 180, 137, 0.4)' },
      indigo: { primary: '#6366f1', hover: '#4f46e5', glow: 'rgba(99, 102, 241, 0.4)' },
      emerald: { primary: '#10b981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.4)' },
      rose: { primary: '#f43f5e', hover: '#e11d48', glow: 'rgba(244, 63, 94, 0.4)' },
      cyan: { primary: '#06b6d4', hover: '#0891b2', glow: 'rgba(6, 182, 212, 0.4)' },
      amber: { primary: '#f59e0b', hover: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' }
    };
    const theme = themes[savedTheme] || themes.emerald;
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--primary-hover', theme.hover);
    document.documentElement.style.setProperty('--primary-glow', theme.glow);
  }, []);
  
  // Settings state
  // Hydrated from the cached RAW settings row through the same mapping the live
  // fetch uses, so a cached boot is byte-identical to a fetched one.
  const [userSettings, setUserSettings] = useState(() => (
    bootCache?.settings?.row
      ? mapSettingsRow(bootCache.settings.row, defaultSettings)
      : defaultSettings
  ));
  const currency = userSettings.currency || 'BDT';

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('trackify_presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return defaultPresets;
  });

  const updatePresets = async (newPresets) => {
    setPresets(newPresets);
    localStorage.setItem('trackify_presets', JSON.stringify(newPresets));
    await updateSettings({ presets: newPresets });
  };

  const [recurringBills, setRecurringBills] = useState(() => {
    const saved = localStorage.getItem('trackify_recurring_bills');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return defaultRecurringBills;
  });

  const updateRecurringBills = async (newBills) => {
    setRecurringBills(newBills);
    localStorage.setItem('trackify_recurring_bills', JSON.stringify(newBills));
    await updateSettings({ recurring_bills: newBills });
  };

  // Notifications state & persistence
  const [notifications, setNotifications] = useState([]);
  const [highlightedBill, setHighlightedBill] = useState(null);

  const [skippedBills, setSkippedBills] = useState(() => {
    const saved = localStorage.getItem('trackify_skipped_bills');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Resets React state only. Safe to call whenever the session goes away for ANY
  // reason — including an expired token that could not be refreshed because the
  // device is offline.
  const resetInMemoryState = useCallback(() => {
    setUserSettings(defaultSettings);
    setPresets(defaultPresets);
    setRecurringBills(defaultRecurringBills);
    setNotifications([]);
    setSkippedBills([]);
    hasCheckedAutoLog.current = false;
  }, []);

  // Wipes this device's stored user data. ONLY call on a real sign-out.
  // Never call it for a merely-absent session: getSession() returns null when an
  // expired token cannot be refreshed, which is exactly what happens offline —
  // clearing here would destroy the user's local data every time they opened the
  // app without signal.
  const clearStoredUserData = useCallback(() => {
    localStorage.removeItem('trackify_presets');
    localStorage.removeItem('trackify_recurring_bills');
    localStorage.removeItem('trackify_skipped_bills');
    localStorage.removeItem(LAST_USER_ID_KEY);

    const notificationKeys = [
      'daily_reminder', 'daily_reminder_time', 'weekly_digest', 'weekly_digest_day',
      'budget_alerts', 'budget_threshold', 'savings_milestones', 'bill_reminders',
      'spend_spike_alerts', 'monthly_review', 'zero_spend_streak', 'budget_exhaustion',
      'weekly_savings_motivation'
    ];
    notificationKeys.forEach(key => {
      localStorage.removeItem(`trackify_${key}`);
    });

    // Sweep over a snapshot of the keys: removing entries while walking
    // localStorage by index skips items (the old loop compensated with an `i--`
    // hack). `trackify_notified_` was also missing from the sweep entirely, so
    // the budget/spike dedupe flags — one per category per month — accumulated
    // forever and were never cleared, even on sign-out.
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('trackify_notifications_') || key.startsWith('trackify_notified_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Full sign-out reset: both halves.
  const resetStateToDefaults = useCallback(() => {
    resetInMemoryState();
    clearStoredUserData();
  }, [resetInMemoryState, clearStoredUserData]);

  async function fetchSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      // Positively confirmed this user already has a settings row → returning user.
      setSettingsRowExists(true);
      const categoryMetadata = data.category_metadata || {};

      const mapped = mapSettingsRow(data, defaultSettings);
      const loadedPresets = mapped.presets;
      const loadedRecurringBills = mapped.recurring_bills;
      const loadedNotificationPrefs = mapped.notification_preferences;
      const loadedSkippedBills = readSkippedBills(data);

      setUserSettings(mapped);

      if (loadedPresets != null) {
        setPresets(loadedPresets);
        localStorage.setItem('trackify_presets', JSON.stringify(loadedPresets));
      }
      if (loadedRecurringBills != null) {
        setRecurringBills(loadedRecurringBills);
        localStorage.setItem('trackify_recurring_bills', JSON.stringify(loadedRecurringBills));
      }
      if (loadedNotificationPrefs != null) {
        const prefs = { ...defaultNotificationPrefs, ...loadedNotificationPrefs };
        Object.keys(prefs).forEach(key => {
          localStorage.setItem(`trackify_${key}`, prefs[key].toString());
        });
      }
      if (loadedSkippedBills != null) {
        setSkippedBills(loadedSkippedBills);
        localStorage.setItem('trackify_skipped_bills', JSON.stringify(loadedSkippedBills));
      }

      // Apply theme mode loaded from Supabase
      const loadedThemeMode = categoryMetadata._theme_mode || localStorage.getItem('trackify_theme_mode') || 'dark';
      setThemeMode(loadedThemeMode);
      localStorage.setItem('trackify_theme_mode', loadedThemeMode);

      // Apply theme accent loaded from Supabase
      const loadedThemeAccent = categoryMetadata._theme_accent || localStorage.getItem('trackify_theme') || 'emerald';
      localStorage.setItem('trackify_theme', loadedThemeAccent);
      const themes = {
        mint: { primary: '#3eb489', hover: '#2e9b73', glow: 'rgba(62, 180, 137, 0.4)' },
        indigo: { primary: '#6366f1', hover: '#4f46e5', glow: 'rgba(99, 102, 241, 0.4)' },
        emerald: { primary: '#10b981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.4)' },
        rose: { primary: '#f43f5e', hover: '#e11d48', glow: 'rgba(244, 63, 94, 0.4)' },
        cyan: { primary: '#06b6d4', hover: '#0891b2', glow: 'rgba(6, 182, 212, 0.4)' },
        amber: { primary: '#f59e0b', hover: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' }
      };
      const selected = themes[loadedThemeAccent] || themes.emerald;
      document.documentElement.style.setProperty('--primary', selected.primary);
      document.documentElement.style.setProperty('--primary-hover', selected.hover);
      document.documentElement.style.setProperty('--primary-glow', selected.glow);
      return { ok: true, row: data };
    } else if (error && error.code === 'PGRST116') {
      // PGRST116 = no row found via .single() → genuinely a brand-new user.
      // A legitimate outcome, not a sync failure.
      setSettingsRowExists(false);
      return { ok: true, row: null };
    }
    // Any other error (network/auth) leaves settingsRowExists unchanged (unknown),
    // so we never misclassify an existing user as new after a failed fetch.
    return { ok: false, error };
  }


  // The fetches no longer own the loading flag (they used to race each other)
  // and no longer swallow errors — they report outcome to refreshAll, which is
  // the single place that decides what the user is told.
  async function fetchTransactions(userId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
      return { ok: true, rows: data };
    }
    return { ok: false, error };
  }

  async function fetchDebts(userId) {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDebts(data);
      return { ok: true, rows: data };
    }
    return { ok: false, error };
  }

  // Loads everything for a user and is the sole writer of `bootstrapped`.
  // allSettled (not all) so one failing slice never hides the others, and a
  // thrown error can't leave the app stuck on the splash screen forever.
  const refreshAll = useCallback(async (userId) => {
    if (!userId) return;
    setSyncState(prev => ({ ...prev, syncing: true }));

    const settled = await Promise.allSettled([
      fetchTransactions(userId),
      fetchDebts(userId),
      fetchSettings(userId),
    ]);
    const [tx, dx, sx] = settled.map(s =>
      s.status === 'fulfilled' ? s.value : { ok: false, error: s.reason }
    );

    const failures = [tx, dx, sx].filter(r => !r.ok);
    const now = Date.now();

    // Cache each slice that actually came back, so a partial success still
    // improves what an offline boot can show. Slices that failed keep whatever
    // was previously cached rather than being blanked.
    const prevCache = readCache(userId);
    writeCache(userId, {
      transactions: tx.ok ? { rows: tx.rows, syncedAt: now } : prevCache?.transactions || null,
      debts: dx.ok ? { rows: dx.rows, syncedAt: now } : prevCache?.debts || null,
      // sx.row is null for a brand-new user with no settings row yet — nothing
      // worth caching, and null would fail validation on read.
      settings: sx.ok && sx.row ? { row: sx.row, syncedAt: now } : prevCache?.settings || null,
    });

    setBootstrapped(true);
    setSyncState(prev => ({
      syncing: false,
      // Only advance the timestamp on a clean pass, so "synced 5m ago" never
      // claims more than we actually have.
      lastSyncedAt: failures.length === 0 ? now : prev.lastSyncedAt,
      lastError: failures.length ? (failures[0].error?.message || 'Sync failed') : null,
      txFailed: !tx.ok,
    }));
  }, []);

  const hasCheckedAutoLog = useRef(false);

  const processAutoLogBills = useCallback(async (bills, existingTransactions) => {
    if (!session?.user) return;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const autoLogged = [];

    for (const bill of bills) {
      if (!bill.autoLog) continue;
      if (today.getDate() < Number(bill.dueDate)) continue;

      const billNameLower = bill.name.toLowerCase();
      const alreadyPaid = existingTransactions.some(tx => {
        const txDate = parseLocalDate(tx.date);
        return tx.type === 'expense' &&
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear &&
          (tx.note?.toLowerCase().includes(billNameLower) || 
           (tx.note?.toLowerCase().includes('recurring') && Number(tx.amount) === Number(bill.amount) && tx.category === bill.category));
      });

      if (!alreadyPaid) {
        const targetDate = new Date(currentYear, currentMonth, Number(bill.dueDate));
        await addTransaction({
          type: 'expense',
          amount: Number(bill.amount),
          category: bill.category,
          note: `[Recurring] ${bill.name}`,
          date: targetDate.toISOString().split('T')[0],
          payment_method: bill.payment || 'Cash'
        });
        autoLogged.push(bill.name);
      }
    }

    if (autoLogged.length > 0) {
      showToast(`Auto-logged ${autoLogged.length} recurring bill(s): ${autoLogged.join(', ')}`, 'info');
    }
  }, [session, addTransaction, showToast]);

  useEffect(() => {
    // Gated on `bootstrapped`, not `!loading`: once the offline cache lands,
    // `loading` goes false as soon as cached data paints, but auto-logging must
    // wait for the real fetch — otherwise an offline boot would re-log bills
    // that already exist on the server.
    if (session && bootstrapped && !hasCheckedAutoLog.current && userSettings.recurring_bills && transactions) {
      hasCheckedAutoLog.current = true;
      processAutoLogBills(userSettings.recurring_bills, transactions);
    }
  }, [session, bootstrapped, userSettings.recurring_bills, transactions, processAutoLogBills]);

  useEffect(() => {
    setTimeout(() => {
      if (session?.user?.id) {
        const saved = localStorage.getItem(`trackify_notifications_${session.user.id}`);
        if (saved) {
          try {
            setNotifications(JSON.parse(saved));
          } catch {
            setNotifications([]);
          }
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    }, 0);
  }, [session]);

  const addNotification = useCallback((title, message, type = 'info', customId = null) => {
    const newNotif = {
      id: customId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      date: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications(prev => {
      if (prev.some(n => n.id === newNotif.id)) {
        return prev;
      }
      const updated = [newNotif, ...prev];
      if (session?.user?.id) {
        localStorage.setItem(`trackify_notifications_${session.user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [session]);

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (session?.user?.id) {
        localStorage.setItem(`trackify_notifications_${session.user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    if (session?.user?.id) {
      localStorage.removeItem(`trackify_notifications_${session.user.id}`);
    }
  };

  const skipBillForMonth = (billName, year, month) => {
    const key = `${year}-${month}-${billName}`;
    const next = skippedBills.includes(key) ? skippedBills : [...skippedBills, key];
    setSkippedBills(next);
    localStorage.setItem('trackify_skipped_bills', JSON.stringify(next));
    updateSettings({ skipped_bills: next });
  };

  const unskipBillForMonth = (billName, year, month) => {
    const key = `${year}-${month}-${billName}`;
    const next = skippedBills.filter(k => k !== key);
    setSkippedBills(next);
    localStorage.setItem('trackify_skipped_bills', JSON.stringify(next));
    updateSettings({ skipped_bills: next });
  };

  // Automatically check due dates for active loans/debts
  useEffect(() => {
    if (session?.user && debts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      debts.forEach(debt => {
        if (debt.status !== 'active' || !debt.due_date) return;

        const dueDate = parseLocalDate(debt.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isOverdue = diffDays < 0;
        const isDueSoon = diffDays >= 0 && diffDays <= 3;

        if (isOverdue || isDueSoon) {
          const notifId = `debt-${debt.id}-${isOverdue ? 'overdue' : 'duesoon'}`;
          
          const alreadyNotified = notifications.some(n => n.id === notifId);
          
          if (!alreadyNotified) {
            const formattedDate = new Date(debt.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const typeStr = debt.type === 'lent' ? 'Receivable' : 'Payable';
            const directionStr = debt.type === 'lent' ? 'from' : 'to';
            const remainingAmount = Number(debt.amount) - Number(debt.settled_amount || 0);

            if (isOverdue) {
              addNotification(
                `Overdue ${typeStr}`,
                `${formatCurrency(remainingAmount, currency)} is overdue ${directionStr} ${debt.person} since ${formattedDate}.`,
                'warning',
                notifId
              );
            } else {
              addNotification(
                `Due Soon: ${typeStr}`,
                `${formatCurrency(remainingAmount, currency)} is due ${directionStr} ${debt.person} on ${formattedDate} (${diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`}).`,
                'info',
                notifId
              );
            }
          }
        }
      });
    }
  }, [debts, session, notifications, addNotification, currency]);

  // Track connectivity. Setting state from a listener registered by an effect is
  // fine (unlike setting it in the effect body).
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setSettingsRowExists(null);
        // A different user than the cache we hydrated from: drop the hydrated
        // state immediately so their numbers are never shown to this account.
        // The other user's cache is left alone — it's theirs, not ours to bin.
        if (activeUserId && activeUserId !== session.user.id) {
          setTransactions([]);
          setDebts([]);
          resetInMemoryState();
        }
        activeUserId = session.user.id;
        writeLastUserId(session.user.id);
        setWasSignedIn(true);
        refreshAll(session.user.id);
      } else {
        // A null session here does NOT mean "signed out" — getSession() also
        // returns null when a stored token has expired and cannot be refreshed,
        // i.e. every offline boot after ~1h. Reset in-memory state only; the
        // user's stored data stays put so the next online boot restores it.
        setSettingsRowExists(null);
        resetInMemoryState();
        setBootstrapped(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        setSettingsRowExists(null);
        writeLastUserId(session.user.id);
        setWasSignedIn(true);
        // No separate "background" mode needed any more: `bootstrapped` only
        // ever goes true, so a token-refresh re-fetch can't flash the splash.
        refreshAll(session.user.id);
      } else {
        setSettingsRowExists(null);
        setTransactions([]);
        setDebts([]);
        // Storage is wiped ONLY for a real sign-out. SIGNED_OUT is emitted
        // solely by signOut(), so it's a reliable gate; every other falsy-session
        // event (a failed token refresh while offline, INITIAL_SESSION with no
        // network) leaves this device's stored data intact.
        if (event === 'SIGNED_OUT') {
          clearCache(activeUserId);
          activeUserId = null;
          resetStateToDefaults();
          setWasSignedIn(false);
        } else {
          resetInMemoryState();
        }
        setBootstrapped(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [resetStateToDefaults, resetInMemoryState, refreshAll]);

  // Realtime database subscription listener
  useEffect(() => {
    if (!session?.user?.id) return;

    const transactionsChannel = supabase
      .channel('realtime:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => {
              if (prev.some(t => t.id === payload.new.id)) return prev;
              const tempIndex = prev.findIndex(t => 
                t.id.toString().startsWith('temp-') && 
                t.amount == payload.new.amount && 
                t.category === payload.new.category &&
                new Date(t.date).getTime() === new Date(payload.new.date).getTime()
              );
              if (tempIndex !== -1) {
                return prev.map((t, idx) => idx === tempIndex ? payload.new : t);
              }
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const debtsChannel = supabase
      .channel('realtime:debts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDebts(prev => {
              if (prev.some(d => d.id === payload.new.id)) return prev;
              const tempIndex = prev.findIndex(d => 
                d.id.toString().startsWith('temp-') && 
                d.amount == payload.new.amount && 
                d.person === payload.new.person
              );
              if (tempIndex !== -1) {
                return prev.map((d, idx) => idx === tempIndex ? payload.new : d);
              }
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setDebts(prev => prev.map(d => d.id === payload.new.id ? payload.new : d));
          } else if (payload.eventType === 'DELETE') {
            setDebts(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel('realtime:user_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Same mapping as fetchSettings — this copy had drifted and was
            // dropping `currency`, so a settings save in another tab reset it.
            const mapped = mapSettingsRow(payload.new, defaultSettings);
            const loadedPresets = mapped.presets;
            const loadedRecurringBills = mapped.recurring_bills;
            const loadedNotificationPrefs = mapped.notification_preferences;
            const loadedSkippedBills = readSkippedBills(payload.new);

            setUserSettings(mapped);

            if (loadedPresets != null) {
              setPresets(loadedPresets);
              localStorage.setItem('trackify_presets', JSON.stringify(loadedPresets));
            }
            if (loadedRecurringBills != null) {
              setRecurringBills(loadedRecurringBills);
              localStorage.setItem('trackify_recurring_bills', JSON.stringify(loadedRecurringBills));
            }
            if (loadedNotificationPrefs != null) {
              const prefs = { ...defaultNotificationPrefs, ...loadedNotificationPrefs };
              Object.keys(prefs).forEach(key => {
                localStorage.setItem(`trackify_${key}`, prefs[key].toString());
              });
            }
            if (loadedSkippedBills != null) {
              setSkippedBills(loadedSkippedBills);
              localStorage.setItem('trackify_skipped_bills', JSON.stringify(loadedSkippedBills));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(debtsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [session]);

  // App Update Checker
  useEffect(() => {
    const checkAppUpdate = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/cupid-shell/trackify/releases/latest');
        if (!response.ok) return;
        const data = await response.json();
        const latestVersion = data.tag_name ? data.tag_name.replace(/^v/, '') : null;

        if (!latestVersion) return;

        const cleanCurrent = currentVersion.replace(/^v/, '');

        if (isVersionNewer(latestVersion, cleanCurrent)) {
          const ignoredVersion = localStorage.getItem('trackify_ignored_update_version');
          if (ignoredVersion === latestVersion) return;

          const apkAsset = data.assets?.find(asset => asset.name.endsWith('.apk'));
          const downloadUrl = apkAsset ? apkAsset.browser_download_url : 'https://github.com/cupid-shell/trackify/releases';

          // Set the global update state to show in-app prompt
          setUpdateAvailable({
            version: latestVersion,
            downloadUrl,
            publishedAt: data.published_at,
            body: data.body
          });

          // Also trigger push notification on native platform
          if (Capacitor.isNativePlatform()) {
            const lastNotified = localStorage.getItem('trackify_notified_update_version');
            if (lastNotified === latestVersion) return;

            let perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
              perm = await LocalNotifications.requestPermissions();
            }

            if (perm.display === 'granted') {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'Trackify Update Available 🚀',
                    body: `Version v${latestVersion} is ready to download! Tap to download the new APK.`,
                    id: 9999,
                    channelId: 'updates',
                    extra: {
                      url: downloadUrl
                    }
                  }
                ]
              });
            }
            localStorage.setItem('trackify_notified_update_version', latestVersion);
          }
        }
      } catch (error) {
        console.error('Error checking for app update:', error);
      }
    };

    // Check 5 seconds after startup
    const timer = setTimeout(checkAppUpdate, 5000);

    // Check every 6 hours as a passive fallback while app is open
    const intervalTimer = setInterval(checkAppUpdate, 6 * 60 * 60 * 1000);

    // Register listener for tapping notification on native platform
    let actionListener = null;
    let appStateListener = null;

    if (Capacitor.isNativePlatform()) {
      // Check for updates whenever the app is brought back to foreground
      appStateListener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // Throttle: only re-check if it's been at least 30 minutes since last check
          const lastCheck = Number(localStorage.getItem('trackify_last_update_check') || '0');
          if (Date.now() - lastCheck > 30 * 60 * 1000) {
            checkAppUpdate();
            localStorage.setItem('trackify_last_update_check', String(Date.now()));
          }
        }
      });

      // Register listener for tapping notifications
      actionListener = LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (action) => {
          const extra = action.notification.extra;
          if (extra?.url) {
            window.open(extra.url, '_blank');
          } else if (extra?.type === 'bill_reminder' && extra?.billName) {
            setHighlightedBill({
              billName: extra.billName,
              timestamp: Date.now(),
              triggerNavigate: true
            });
          }
        }
      );
    }

    return () => {
      clearTimeout(timer);
      clearInterval(intervalTimer);
      if (actionListener) actionListener.remove();
      if (appStateListener) appStateListener.remove();
    };
  }, []);


  const updateSettings = async (newSettings) => {
    if (!session?.user) return;
    
    // Construct the updated category_metadata that holds fallback settings
    const currentMetadata = { ...(newSettings.category_metadata || userSettings.category_metadata || {}) };

    if (newSettings.theme_mode !== undefined) {
      currentMetadata._theme_mode = newSettings.theme_mode;
    }
    if (newSettings.theme_accent !== undefined) {
      currentMetadata._theme_accent = newSettings.theme_accent;
    }
    if (newSettings.currency !== undefined) {
      currentMetadata._currency = newSettings.currency;
    }
    
    const updatedPresets = newSettings.presets !== undefined ? newSettings.presets : presets;
    const updatedBills = newSettings.recurring_bills !== undefined ? newSettings.recurring_bills : recurringBills;
    const updatedSkipped = newSettings.skipped_bills !== undefined ? newSettings.skipped_bills : skippedBills;
    
    let updatedPrefs = newSettings.notification_preferences;
    if (!updatedPrefs) {
      updatedPrefs = {};
      Object.keys(defaultNotificationPrefs).forEach(key => {
        const val = localStorage.getItem(`trackify_${key}`);
        if (val !== null) {
          updatedPrefs[key] = val === 'true' || (val !== 'false' && val);
        } else {
          updatedPrefs[key] = defaultNotificationPrefs[key];
        }
      });
    }

    currentMetadata._presets = updatedPresets;
    currentMetadata._recurring_bills = updatedBills;
    currentMetadata._notification_preferences = updatedPrefs;
    currentMetadata._skipped_bills = updatedSkipped;

    // Optimistic UI update
    setUserSettings(prev => ({ 
      ...prev, 
      ...newSettings,
      category_metadata: currentMetadata
    }));

    if (newSettings.presets != null) {
      setPresets(newSettings.presets);
      localStorage.setItem('trackify_presets', JSON.stringify(newSettings.presets));
    }
    if (newSettings.recurring_bills != null) {
      setRecurringBills(newSettings.recurring_bills);
      localStorage.setItem('trackify_recurring_bills', JSON.stringify(newSettings.recurring_bills));
    }
    if (newSettings.skipped_bills != null) {
      setSkippedBills(newSettings.skipped_bills);
      localStorage.setItem('trackify_skipped_bills', JSON.stringify(newSettings.skipped_bills));
    }
    if (newSettings.notification_preferences != null) {
      const prefs = newSettings.notification_preferences;
      Object.keys(prefs).forEach(key => {
        localStorage.setItem(`trackify_${key}`, prefs[key].toString());
      });
    }

    const cleanSettingsForPayload = { ...newSettings };
    delete cleanSettingsForPayload.theme_mode;
    delete cleanSettingsForPayload.theme_accent;
    delete cleanSettingsForPayload.currency;

    const payload = {
      user_id: session.user.id,
      ...cleanSettingsForPayload,
      category_metadata: currentMetadata,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert(payload);

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.warn('Supabase schema does not have presets, recurring_bills, or notification_preferences yet. Falling back to standard settings upsert.', error);
        const fallbackSettings = { ...newSettings };
        delete fallbackSettings.presets;
        delete fallbackSettings.recurring_bills;
        delete fallbackSettings.notification_preferences;
        delete fallbackSettings.theme_mode;
        delete fallbackSettings.theme_accent;
        delete fallbackSettings.currency;
        const fallbackPayload = {
          user_id: session.user.id,
          ...fallbackSettings,
          category_metadata: currentMetadata,
          updated_at: new Date().toISOString()
        };
        const { error: fallbackError } = await supabase
          .from('user_settings')
          .upsert(fallbackPayload);
        if (fallbackError) {
          showToast('Error saving settings (fallback): ' + fallbackError.message, 'error');
        }
      } else {
        showToast('Error saving settings: ' + error.message, 'error');
      }
    }
  };

  const toggleThemeMode = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    
    document.body.classList.add('theme-transitioning');
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 500);

    updateSettings({ theme_mode: newMode });
  }, [themeMode]);

  const addDebt = async (debt, logAsTransaction) => {
    if (!session?.user) return;

    // eslint-disable-next-line react-hooks/purity
    const tempId = `temp-${Date.now()}`;
    const newDebt = { 
      ...debt, 
      id: tempId, 
      user_id: session.user.id, 
      settled_amount: 0, 
      status: 'active',
      payments: []
    };
    setDebts(prev => [newDebt, ...prev]);

    const { data, error } = await supabase
      .from('debts')
      .insert([
        {
          user_id: session.user.id,
          type: debt.type,
          person: debt.person,
          amount: debt.amount,
          due_date: debt.due_date || null,
          note: debt.note || null,
          date: debt.date || new Date().toISOString().split('T')[0],
          payments: []
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setDebts(prev => prev.map(d => d.id === tempId ? data : d));
      
      if (logAsTransaction) {
        const txType = debt.type === 'lent' ? 'expense' : 'income';
        const txCategory = 'Debt/Loan';
        const txNote = debt.type === 'lent' 
          ? `Lent to ${debt.person}${debt.note ? `: ${debt.note}` : ''}`
          : `Borrowed from ${debt.person}${debt.note ? `: ${debt.note}` : ''}`;
        
        await addTransaction({
          type: txType,
          amount: debt.amount,
          category: txCategory,
          date: debt.date || new Date().toISOString().split('T')[0],
          note: txNote,
          payment_method: 'Cash',
          debt_id: data.id
        });
      }
      return data;
    } else {
      setDebts(prev => prev.filter(d => d.id !== tempId));
      showToast('Error adding debt record: ' + error?.message, 'error');
      return null;
    }
  };

  const recordDebtRepayment = async (debtId, amount, note, logAsTransaction) => {
    if (!session?.user) return;

    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const newSettledAmount = Number(debt.settled_amount || 0) + Number(amount);
    const newStatus = newSettledAmount >= Number(debt.amount) ? 'settled' : 'active';
    const newPayment = {
      date: new Date().toISOString().split('T')[0],
      amount: Number(amount),
      note: note || ''
    };
    const newPayments = [...(debt.payments || []), newPayment];

    const originalDebts = [...debts];
    setDebts(prev => prev.map(d => d.id === debtId ? { 
      ...d, 
      settled_amount: newSettledAmount, 
      status: newStatus,
      payments: newPayments
    } : d));

    const { data, error } = await supabase
      .from('debts')
      .update({
        settled_amount: newSettledAmount,
        status: newStatus,
        payments: newPayments,
        updated_at: new Date().toISOString()
      })
      .eq('id', debtId)
      .eq('user_id', session.user.id)
      .select();

    if (error || !data || data.length === 0) {
      setDebts(originalDebts);
      showToast('Error updating debt repayment: ' + (error?.message || 'Update failed'), 'error');
      return;
    }

    setDebts(prev => prev.map(d => d.id === debtId ? data[0] : d));

    if (logAsTransaction) {
      const txType = debt.type === 'lent' ? 'income' : 'expense';
      const txCategory = 'Debt/Loan';
      const txNote = debt.type === 'lent'
        ? `Repayment from ${debt.person}${note ? `: ${note}` : ''}`
        : `Repay to ${debt.person}${note ? `: ${note}` : ''}`;

      await addTransaction({
        type: txType,
        amount: Number(amount),
        category: txCategory,
        date: new Date().toISOString(),
        note: txNote,
        payment_method: 'Cash',
        debt_id: debtId
      });
    }
  };

  const updateDebt = async (debtId, fields) => {
    if (!session?.user) return;

    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    // Editing the principal can flip a record between active/settled, so
    // recompute status against the amount already settled.
    const newAmount = Number(fields.amount);
    const settled = Number(debt.settled_amount || 0);
    const newStatus = settled >= newAmount ? 'settled' : 'active';

    const updatePayload = {
      type: fields.type,
      person: fields.person,
      amount: newAmount,
      due_date: fields.due_date || null,
      note: fields.note || null,
      date: fields.date,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    const originalDebts = [...debts];
    setDebts(prev => prev.map(d => d.id === debtId ? { ...d, ...updatePayload } : d));

    const { data, error } = await supabase
      .from('debts')
      .update(updatePayload)
      .eq('id', debtId)
      .eq('user_id', session.user.id)
      .select();

    if (error || !data || data.length === 0) {
      setDebts(originalDebts);
      showToast('Error updating debt record: ' + (error?.message || 'Update failed'), 'error');
      return;
    }

    setDebts(prev => prev.map(d => d.id === debtId ? data[0] : d));
    showToast('Debt record updated.', 'success');
  };

  const deleteDebt = async (debtId) => {
    const originalDebts = [...debts];
    const originalTransactions = [...transactions];
    setDebts(prev => prev.filter(d => d.id !== debtId));
    setTransactions(prev => prev.filter(tx => tx.debt_id !== debtId));

    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', debtId)
      .eq('user_id', session.user.id);

    if (error) {
      setDebts(originalDebts);
      setTransactions(originalTransactions);
      showToast('Error deleting debt record: ' + error.message, 'error');
    }
  };

  const uploadReceiptFile = async (file) => {
    if (!session?.user) throw new Error('User not logged in');

    // Security and stability check: size limit (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('File size exceeds the 5MB limit. Please upload a smaller image.');
    }

    // Security check: allowed file extensions and MIME types
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'pdf'];
    const allowedMIMETypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'application/pdf'];
    
    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowedExtensions.includes(fileExt) || !allowedMIMETypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, WEBP, GIF, HEIC, and PDF are allowed.');
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage Upload Error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const addReceiptAttachment = useCallback(async (txId, url) => {
    const currentMetadata = { ...(userSettings.category_metadata || {}) };
    currentMetadata._receipt_attachments = {
      ...(currentMetadata._receipt_attachments || {}),
      [txId]: url
    };
    await updateSettings({ category_metadata: currentMetadata });
  }, [userSettings.category_metadata, updateSettings]);

  async function addTransaction(transaction) {
    if (!session?.user) return null;

    // Optimistic UI update
    // eslint-disable-next-line react-hooks/purity
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
          payment_method: transaction.payment_method || 'Cash',
          debt_id: transaction.debt_id || null
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setTransactions(prev => prev.map(tx => tx.id === tempId ? data : tx));
      checkTransactionAlerts(data);
      return data;
    } else {
      setTransactions(prev => prev.filter(tx => tx.id !== tempId));
      showToast('Error adding transaction: ' + error.message, 'error');
      return null;
    }
  }

  async function addTransactions(transactionList) {
    if (!session?.user || !transactionList || transactionList.length === 0) return null;

    // Optimistic UI: generate temp IDs and push all rows at once
    const tempRows = transactionList.map((tx, i) => ({
      ...tx,
      id: `temp-${Date.now()}-${i}`,
      user_id: session.user.id
    }));
    setTransactions(prev => [...tempRows, ...prev]);

    const insertPayload = transactionList.map(tx => ({
      user_id: session.user.id,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      note: tx.note || '',
      payment_method: tx.payment_method || 'Cash',
      debt_id: tx.debt_id || null
    }));

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertPayload)
      .select();

    if (!error && data) {
      // Replace temp rows with real rows
      setTransactions(prev => {
        const withoutTemps = prev.filter(tx => !tempRows.some(t => t.id === tx.id));
        return [...data, ...withoutTemps];
      });
      data.forEach(tx => checkTransactionAlerts(tx));
      return data;
    } else {
      // Rollback optimistic rows
      setTransactions(prev => prev.filter(tx => !tempRows.some(t => t.id === tx.id)));
      showToast('Error adding transactions: ' + (error?.message || 'Unknown error'), 'error');
      return null;
    }
  };

  // --- Reimbursable expenses ------------------------------------------------
  // A reimbursable expense is bridged to the Ledger as a real `lent` receivable.
  // The link lives in category_metadata._reimbursable ({ [txId]: debtId }) — NOT
  // the transactions.debt_id column, whose FK is ON DELETE CASCADE (deleting the
  // receivable would delete the expense). Badge status/amount are read live from
  // `debts`, so the two can never drift out of sync.
  const reimbursements = userSettings.category_metadata?._reimbursable || {};

  const markTransactionsReimbursable = async (pairs) => {
    if (!pairs || pairs.length === 0) return;
    const newLinks = {};
    for (const { tx, person, amount, dueDate } of pairs) {
      // logAsTransaction:false — the expense already exists; we don't want a
      // second "Lent to X" transaction, only the receivable.
      const debt = await addDebt({
        type: 'lent',
        person: (person || '').trim() || 'Someone',
        amount: Number(amount),
        note: `Reimbursable: ${tx.category}`,
        date: (tx.date || '').split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: dueDate || null,
      }, false);
      if (debt?.id) newLinks[tx.id] = debt.id;
    }
    if (Object.keys(newLinks).length === 0) return;
    const meta = userSettings.category_metadata || {};
    await updateSettings({
      category_metadata: {
        ...meta,
        _reimbursable: { ...(meta._reimbursable || {}), ...newLinks },
      },
    });
  };

  const unmarkReimbursable = async (txId) => {
    const meta = userSettings.category_metadata || {};
    if (!meta._reimbursable || !(txId in meta._reimbursable)) return;
    const next = { ...meta._reimbursable };
    delete next[txId];
    await updateSettings({ category_metadata: { ...meta, _reimbursable: next } });
  };

  // A deleted row disappears from the UI immediately, but the Supabase delete is
  // deferred (see pendingTxDeletes) so an "Undo" toast can cancel it. Nothing
  // leaves the database during the window, so undo keeps the original row id —
  // and its receipt attachment — intact.
  const commitDelete = async (id) => {
    const pending = pendingTxDeletes[id];
    if (!pending) return;
    clearTimeout(pending.timer);
    delete pendingTxDeletes[id];

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      // The delete never landed — restore the row so the UI matches the DB.
      setTransactions(prev => (prev.some(t => t.id === id) ? prev : [...prev, pending.tx]));
      showToast('Error deleting transaction: ' + error.message, 'error');
    } else {
      // Always drop the reimbursable link. By default the Ledger receivable
      // stays (the money is still owed even if the expense record is gone); if
      // the user opted to remove it on delete, drop it too.
      unmarkReimbursable(id);
      if (pending.debtId) await deleteDebt(pending.debtId);
    }
  };

  const undoDelete = (id) => {
    const pending = pendingTxDeletes[id];
    if (!pending) return;
    clearTimeout(pending.timer);
    delete pendingTxDeletes[id];
    setTransactions(prev => (prev.some(t => t.id === id) ? prev : [...prev, pending.tx]));
    showToast('Deletion undone', 'success');
  };

  const deleteTransaction = (id, opts = {}) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    // If asked, also remove the linked Ledger receivable when the delete commits.
    const debtId = opts.alsoDeleteDebt ? (userSettings.category_metadata?._reimbursable?.[id] || null) : null;

    // Hide immediately; defer the real delete so it can be undone.
    setTransactions(prev => prev.filter(t => t.id !== id));
    const timer = setTimeout(() => commitDelete(id), 5000);
    pendingTxDeletes[id] = { tx, timer, debtId };

    showToast('Transaction deleted', 'info', {
      duration: 5000,
      action: { label: 'Undo', onClick: () => undoDelete(id) },
    });
  };

  const updateTransaction = async (id, updatedFields) => {
    if (!session?.user) return false;

    // Optimistic UI update
    const originalTransactions = [...transactions];
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updatedFields } : tx));

    const { data, error } = await supabase
      .from('transactions')
      .update(updatedFields)
      .eq('id', id)
      .eq('user_id', session.user.id)  // belt-and-suspenders: ensures RLS match
      .select();

    if (error) {
      setTransactions(originalTransactions);
      showToast('Error updating transaction: ' + error.message, 'error');
      return false;
    }

    // If no rows came back, the DB silently rejected the update (e.g. missing UPDATE policy)
    if (!data || data.length === 0) {
      setTransactions(originalTransactions);
      showToast('Update failed: the change was not saved to the database. Please run the missing UPDATE policy SQL in your Supabase dashboard:\n\nCREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', 'error');
      return false;
    }

    setTransactions(prev => prev.map(tx => tx.id === id ? data[0] : tx));
    return true;
  };

  const renameCategory = async (oldName, newName, type) => {
    if (!session?.user || oldName === newName || !newName.trim()) return;
    
    const trimmedNewName = newName.trim();

    // 1. Update user settings locally
    const newSettings = { ...userSettings };
    const listKey = type === 'expense' ? 'expense_categories' : 'income_categories';
    const index = newSettings[listKey].indexOf(oldName);
    
    if (index !== -1) {
      newSettings[listKey][index] = trimmedNewName;
    } else {
      // If the old category wasn't in the list (e.g. an orphaned category), just return.
      return;
    }

    if (type === 'expense' && newSettings.category_budgets && newSettings.category_budgets[oldName]) {
      const budgetValue = newSettings.category_budgets[oldName];
      delete newSettings.category_budgets[oldName];
      newSettings.category_budgets[trimmedNewName] = budgetValue;
    }
    
    // Optistic UI for settings
    setUserSettings(newSettings);

    // 3. Save settings to DB
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        ...newSettings,
        updated_at: new Date().toISOString()
      });

    if (settingsError) {
      showToast('Error saving renamed category setting: ' + settingsError.message, 'error');
    }

    // 4. Update transactions in DB (Preserve old category in note!)
    const { data: txsToUpdate } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('type', type)
      .eq('category', oldName);

    if (txsToUpdate && txsToUpdate.length > 0) {
      const updatedTxs = txsToUpdate.map(tx => {
        // If they are merging "Snacks" into "Food", we save "Snacks" in the note.
        const newNote = tx.note ? `[${oldName}] ${tx.note}` : oldName;
        return {
          ...tx,
          category: trimmedNewName,
          note: newNote
        };
      });

      const { error: txError } = await supabase
        .from('transactions')
        .upsert(updatedTxs);

      if (txError) {
        showToast('Error migrating past transactions: ' + txError.message, 'error');
      } else {
        // Also update local state notes so UI reflects it immediately
        setTransactions(prev => prev.map(tx => {
          if (tx.type === type && tx.category === oldName) {
            const newNote = tx.note ? `[${oldName}] ${tx.note}` : oldName;
            return { ...tx, category: trimmedNewName, note: newNote };
          }
          return tx;
        }));
      }
    }
  };

  const addSavingsGoal = async (goal) => {
    if (!session?.user) return;
    const newGoals = [...(userSettings.savings_goals || []), goal];
    await updateSettings({ savings_goals: newGoals });
  };

  const deleteSavingsGoal = async (id) => {
    if (!session?.user) return;
    const newGoals = (userSettings.savings_goals || []).filter(g => g.id !== id);
    await updateSettings({ savings_goals: newGoals });
  };

  const updateSavingsGoalProgress = async (id, amount, isContribution) => {
    if (!session?.user) return;
    const newGoals = (userSettings.savings_goals || []).map(g => {
      if (g.id === id) {
        const change = Number(amount);
        const current = Number(g.current_amount || 0);
        const next = isContribution ? current + change : Math.max(0, current - change);
        
        // Trigger local milestone alerts
        checkSavingsMilestone(g, next);

        return { ...g, current_amount: next };
      }
      return g;
    });
    await updateSettings({ savings_goals: newGoals });
  };

  const updateCategoryMetadata = async (categoryName, metadata) => {
    if (!session?.user) return;
    const newMetadata = {
      ...(userSettings.category_metadata || {}),
      [categoryName]: {
        ...(userSettings.category_metadata?.[categoryName] || {}),
        ...metadata
      }
    };
    await updateSettings({ category_metadata: newMetadata });
  };

  const getCategoryStyle = (catName) => {
    const defaults = {
      "Rent": { emoji: "🏠", color: "#6366f1" },
      "Seat Rent": { emoji: "🏠", color: "#6366f1" },
      "Utilities & Bills": { emoji: "⚡", color: "#06b6d4" },
      "Utility Bill": { emoji: "⚡", color: "#06b6d4" },
      "Gas Bill (Cylinder)": { emoji: "🔥", color: "#ec4899" },
      "Food & Dining": { emoji: "🍔", color: "#f59e0b" },
      "Transport": { emoji: "🚗", color: "#10b981" },
      "Daily Living": { emoji: "🛒", color: "#a855f7" },
      "Personal Expenses": { emoji: "🛍️", color: "#a855f7" },
      "Education": { emoji: "🎓", color: "#84cc16" },
      "AI Subscription": { emoji: "🤖", color: "#8b5cf6" },
      "Ai Subscription": { emoji: "🤖", color: "#8b5cf6" },
      "Ai": { emoji: "🤖", color: "#8b5cf6" },
      "AI": { emoji: "🤖", color: "#8b5cf6" },
      "Other / Unexpected": { emoji: "❓", color: "#f43f5e" },
      "Other / Miscellaneous": { emoji: "❓", color: "#f43f5e" }
    };
    
    const getHashColor = (name) => {
      const palette = [
        '#f43f5e', '#ff6b6b', '#f97316', '#f59e0b', 
        '#e3b341', '#84cc16', '#10b981', '#39d353', 
        '#06b6d4', '#14b8a6', '#58a6ff', '#38bdf8', 
        '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
      ];
      let hash = 0;
      const clean = name ? name.toString().trim() : '';
      for (let i = 0; i < clean.length; i++) {
        hash = clean.charCodeAt(i) + ((hash << 5) - hash);
      }
      return palette[Math.abs(hash) % palette.length];
    };

    const metadata = userSettings.category_metadata || {};
    if (metadata[catName]) {
      return {
        emoji: metadata[catName].emoji || "🏷️",
        color: metadata[catName].color || getHashColor(catName)
      };
    }
    
    if (defaults[catName]) {
      return defaults[catName];
    }
    
    return { 
      emoji: "🏷️", 
      color: getHashColor(catName) 
    };
  };

  const rescheduleNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Ensure notification permissions are granted on native platforms
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display !== 'granted') {
        console.warn('Notification permissions were denied.');
        return;
      }

      // Create custom notification channels for Android 8+
      await LocalNotifications.createChannel({
        id: 'reminders',
        name: 'Daily Reminders & Alerts',
        description: 'Notifications for daily logging reminders, budget alerts, and savings progress.',
        importance: 4, // High importance (plays sound + banners)
        vibration: true,
        lights: true,
        lightColor: '#10b981'
      });

      await LocalNotifications.createChannel({
        id: 'updates',
        name: 'App Updates',
        description: 'Notifications when new versions of Trackify are available for download.',
        importance: 3, // Default importance
        vibration: true,
        lights: false
      });

      // 1. Cancel existing scheduled local notifications
      const pending = await LocalNotifications.getPending();
      if (pending.notifications && pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      // 2. Fetch preferences from localStorage
      const dailyEnabled = localStorage.getItem('trackify_daily_reminder') !== 'false';
      const dailyTime = localStorage.getItem('trackify_daily_reminder_time') || '21:30';
      const weeklyEnabled = localStorage.getItem('trackify_weekly_digest') !== 'false';
      const weeklyDay = localStorage.getItem('trackify_weekly_digest_day') || 'Saturday';
      const billsEnabled = localStorage.getItem('trackify_bill_reminders') !== 'false';
      
      const monthlyReviewEnabled = localStorage.getItem('trackify_monthly_review') !== 'false';
      const zeroSpendEnabled = localStorage.getItem('trackify_zero_spend_streak') !== 'false';
      const weeklySavingsEnabled = localStorage.getItem('trackify_weekly_savings_motivation') !== 'false';

      const notificationsToSchedule = [];

      // 3. Daily Activity Reminder & Zero-Spend Day (ID: 1001)
      if (dailyEnabled) {
        const [hour, minute] = dailyTime.split(':').map(Number);
        const now = new Date();
        const todayDateStr = now.toISOString().split('T')[0];
        
        const todayTransactions = transactions.filter(tx => tx.date === todayDateStr);
        const hasLogsToday = todayTransactions.length > 0;
        const hasExpensesToday = todayTransactions.some(tx => tx.type === 'expense');
        
        const scheduleTime = new Date();
        scheduleTime.setHours(hour, minute, 0, 0);

        let title = 'Forgot to log today? 💸';
        let body = 'Open Trackify to log your expenses and keep your budget on track!';
        let shouldSchedule = true;

        if (hasLogsToday) {
          if (!hasExpensesToday && zeroSpendEnabled) {
            title = 'Zero-Spend Day! 🎉';
            body = 'Awesome job! You didn\'t log any expenses today. Keep up the great savings streak!';
            if (scheduleTime <= now) {
              shouldSchedule = false;
            }
          } else {
            // Already logged an expense today, schedule "forgot to log" reminder for tomorrow
            scheduleTime.setDate(scheduleTime.getDate() + 1);
          }
        } else {
          if (scheduleTime <= now) {
            scheduleTime.setDate(scheduleTime.getDate() + 1);
          }
        }

        if (shouldSchedule) {
          notificationsToSchedule.push({
            title,
            body,
            id: 1001,
            channelId: 'reminders',
            schedule: { at: scheduleTime }
          });
        }
      }

      // 4. Weekly Spending Digest (ID: 1002)
      if (weeklyEnabled) {
        const dayMap = {
          'Sunday': 1, 'Monday': 2, 'Tuesday': 3, 'Wednesday': 4,
          'Thursday': 5, 'Friday': 6, 'Saturday': 7
        };
        const targetDay = dayMap[weeklyDay] || 7; // Default Saturday
        
        // Schedule weekly recurring digest
        notificationsToSchedule.push({
          title: 'Your Weekly Spend Summary 📊',
          body: 'A new week has started! Tap to open Trackify and review your budget progress.',
          id: 1002,
          channelId: 'reminders',
          schedule: {
            every: 'week',
            on: {
              weekday: targetDay,
              hour: 11,
              minute: 0
            }
          }
        });
      }

      // 5. Monthly Financial Review (ID: 1003)
      if (monthlyReviewEnabled) {
        const now = new Date();
        let nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);
        notificationsToSchedule.push({
          title: 'Monthly Financial Review 📊',
          body: 'A new month has started! Tap to review your complete spending and savings for the past month.',
          id: 1003,
          channelId: 'reminders',
          schedule: { at: nextMonth }
        });
      }

      // 6. Weekly Savings Goal Motivation (ID: 1005)
      if (weeklySavingsEnabled) {
        notificationsToSchedule.push({
          title: 'Keep Saving! 🎯',
          body: 'Review your savings goals this weekend. Small additions add up to big achievements!',
          id: 1005,
          channelId: 'reminders',
          schedule: {
            every: 'week',
            on: {
              weekday: 1, // Sunday
              hour: 10,
              minute: 0
            }
          }
        });
      }

      // 7. Recurring Bill Reminders (IDs: 2000+)
      if (billsEnabled && recurringBills && recurringBills.length > 0) {
        recurringBills.forEach((bill, idx) => {
          const now = new Date();
          const dueDay = Number(bill.dueDate);
          
          let scheduleTime = new Date();
          scheduleTime.setDate(dueDay);
          scheduleTime.setHours(9, 0, 0, 0);

          if (scheduleTime <= now) {
            // Schedule for next month
            scheduleTime.setMonth(scheduleTime.getMonth() + 1);
          }

          notificationsToSchedule.push({
            title: `Bill Due Today: ${bill.name} 🏠`,
            body: `Your payment of ${formatCurrency(bill.amount, currency)} for ${bill.category} is due. Tap to record it!`,
            id: 2000 + idx,
            channelId: 'reminders',
            schedule: { at: scheduleTime },
            extra: {
              type: 'bill_reminder',
              billName: bill.name
            }
          });
        });
      }

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule
        });
      }
    } catch (error) {
      console.error('Error rescheduling notifications:', error);
    }
  }, [transactions, recurringBills, currency]);

  const checkTransactionAlerts = async (newTx) => {
    if (!Capacitor.isNativePlatform() || newTx.type !== 'expense') return;
    
    // 1. Budget Alerts & Exhaustion Warnings
    const budgetAlertsEnabled = localStorage.getItem('trackify_budget_alerts') !== 'false';
    const budgetExhaustionEnabled = localStorage.getItem('trackify_budget_exhaustion') !== 'false';

    if (budgetAlertsEnabled || budgetExhaustionEnabled) {
      const thresholdPercent = Number(localStorage.getItem('trackify_budget_threshold') || '85');
      const budgets = userSettings.category_budgets || {};
      const cat = newTx.category;
      const limit = budgets[cat];

      if (limit && limit > 0) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthTxs = transactions.filter(tx => {
          const txDate = parseLocalDate(tx.date);
          return tx.type === 'expense' && 
                 tx.category === cat && 
                 txDate.getMonth() === currentMonth && 
                 txDate.getFullYear() === currentYear;
        });

        const totalSpent = currentMonthTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) + Number(newTx.amount);
        const currentMonthStr = `${currentYear}-${currentMonth + 1}`;

        if (budgetExhaustionEnabled && totalSpent >= limit) {
          const notifyKey = `trackify_notified_budget_exhaust_${cat}_${currentMonthStr}`;
          
          if (localStorage.getItem(notifyKey) !== 'true') {
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: `Budget Exhausted! 🛑`,
                    body: `You have spent ${formatCurrency(totalSpent, currency)} out of your ${formatCurrency(limit, currency)} budget limit for ${cat}.`,
                    // Deterministic ID: 3500 + hash of category name (no random, so Android deduplicates)
                    id: 3500 + (Math.abs(cat.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)) % 400),
                    channelId: 'reminders',
                  }
                ]
              });
              localStorage.setItem(notifyKey, 'true');
            } catch (e) {
              console.error('Error scheduling budget exhaustion alert:', e);
            }
          }
        } else if (budgetAlertsEnabled && totalSpent >= (limit * thresholdPercent) / 100) {
          const notifyKey = `trackify_notified_budget_${cat}_${currentMonthStr}`;
          
          if (localStorage.getItem(notifyKey) !== 'true') {
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: `Budget Warning: ${cat} ⚠️`,
                    body: `You have spent ${formatCurrency(totalSpent, currency)} out of your ${formatCurrency(limit, currency)} budget limit for ${cat} (${Math.round((totalSpent / limit) * 100)}%).`,
                    // Deterministic ID: 3000 + hash of category name
                    id: 3000 + (Math.abs(cat.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)) % 400),
                    channelId: 'reminders',
                  }
                ]
              });
              localStorage.setItem(notifyKey, 'true');
            } catch (e) {
              console.error('Error scheduling budget warning:', e);
            }
          }
        }
      }
    }

    // 2. Spend Spike Alerts
    const spendSpikeEnabled = localStorage.getItem('trackify_spend_spike_alerts') !== 'false';
    if (spendSpikeEnabled) {
      const cat = newTx.category;
      const categoryTxs = transactions.filter(tx => tx.type === 'expense' && tx.category === cat);
      if (categoryTxs.length >= 3) {
        const total = categoryTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const average = total / categoryTxs.length;
        if (Number(newTx.amount) > 3 * average) {
          // Throttle: only one spike alert per category per day
          const today = new Date().toISOString().split('T')[0];
          const spikeKey = `trackify_notified_spike_${cat}_${today}`;
          if (localStorage.getItem(spikeKey) !== 'true') {
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'Unusual Spending Spike 🚨',
                    body: `You just logged a ${formatCurrency(newTx.amount, currency)} expense for ${cat}, which is significantly higher than your typical average (${formatCurrency(Math.round(average), currency)}).`,
                    // Deterministic ID: 5000 + hash of category name
                    id: 5000 + (Math.abs(cat.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)) % 400),
                    channelId: 'reminders',
                  }
                ]
              });
              localStorage.setItem(spikeKey, 'true');
            } catch (e) {
              console.error('Error scheduling spend spike notification:', e);
            }
          }
        }
      }
    }
  };

  const checkSavingsMilestone = async (goal, nextAmount) => {
    if (!Capacitor.isNativePlatform()) return;

    const milestonesEnabled = localStorage.getItem('trackify_savings_milestones') !== 'false';
    if (!milestonesEnabled) return;

    const target = Number(goal.target_amount);
    if (!target || target <= 0) return;

    const currentPercent = Math.round(((goal.current_amount || 0) / target) * 100);
    const nextPercent = Math.round((nextAmount / target) * 100);

    let milestoneCrossed = null;

    if (currentPercent < 50 && nextPercent >= 50) {
      milestoneCrossed = 50;
    } else if (currentPercent < 75 && nextPercent >= 75) {
      milestoneCrossed = 75;
    } else if (currentPercent < 100 && nextPercent >= 100) {
      milestoneCrossed = 100;
    }

    if (milestoneCrossed) {
      const titleMap = {
        50: 'Halfway there! 🎯',
        75: 'Almost completed! 🚀',
        100: 'Goal Achieved! 🎉'
      };
      
      const bodyMap = {
        50: `Your savings goal "${goal.name}" is now 50% complete (${formatCurrency(nextAmount, currency)}/${formatCurrency(target, currency)}).`,
        75: `Your savings goal "${goal.name}" is now 75% complete (${formatCurrency(nextAmount, currency)}/${formatCurrency(target, currency)}).`,
        100: `Congratulations! You have fully achieved your "${goal.name}" savings goal!`
      };

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: titleMap[milestoneCrossed],
              body: bodyMap[milestoneCrossed],
              id: 4000 + milestoneCrossed + (Number(goal.id.slice(-4)) || 0),
              channelId: 'reminders',
            }
          ]
        });
      } catch (e) {
        console.error('Error scheduling milestone notification:', e);
      }
    }
  };

  useEffect(() => {
    if (session) {
      rescheduleNotifications();
    }
  }, [session, rescheduleNotifications]);

  const currentRealDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentRealDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentRealDate.getFullYear());

  const currentMonthTransactions = filterByMonth(transactions, selectedMonth, selectedYear);

  const { totalIncome, totalExpenses, balance } = computeMonthTotals(currentMonthTransactions, userSettings.base_income);

  const rolloverData = useMemo(() => computeRollovers({
    transactions,
    enabledCategories: userSettings.category_metadata?._budget_rollover?.enabled_categories || [],
    budgets: userSettings.category_budgets || {},
    selectedYear,
    selectedMonth,
  }), [transactions, userSettings.category_budgets, userSettings.category_metadata?._budget_rollover?.enabled_categories, selectedMonth, selectedYear]);

  const activeRolloverData = useMemo(() => {
    return rolloverData[`${selectedYear}-${selectedMonth}`] || {};
  }, [rolloverData, selectedMonth, selectedYear]);

  const formatAmount = useCallback((amount) => {
    return formatCurrency(amount, currency);
  }, [currency]);

  const isOnboardingNeeded = useMemo(() => {
    // `bootstrapped`, not `!loading`: onboarding is a decision about what the
    // SERVER holds, so it must wait for a real fetch even once cached data has
    // already painted the UI.
    if (!bootstrapped || !session) return false;
    const completed = userSettings.category_metadata?._onboarding_completed;
    if (completed === true) return false;
    if (completed === false) return true;

    // The flag is undefined (e.g. an account that predates the onboarding feature).
    // CRITICAL: a returning user must never be shown new-user onboarding just
    // because a fetch was slow or failed after a session/network hiccup. Only
    // proceed once we have POSITIVELY confirmed there is no settings row.
    // settingsRowExists === true  -> existing user, skip onboarding
    // settingsRowExists === null  -> unknown (fetch in flight or failed), skip onboarding to be safe
    // settingsRowExists === false -> confirmed no row, fall through to the data checks below
    if (settingsRowExists !== false) return false;

    // Confirmed no settings row — corroborate with any other existing data.
    const hasTransactions = transactions.length > 0;
    const hasBudgets = Object.keys(userSettings.category_budgets || {}).length > 0;
    const hasSavingsGoals = (userSettings.savings_goals || []).length > 0;

    if (hasTransactions || hasBudgets || hasSavingsGoals) {
      return false;
    }

    return true; // Brand new user
  }, [bootstrapped, session, userSettings, transactions, settingsRowExists]);

  // True when we tried to load and failed and have nothing to show. Lets the UI
  // say "couldn't load" instead of the old lie, "no transactions yet".
  const dataUnavailable = syncState.txFailed && transactions.length === 0;

  const value = {
    session,
    currency,
    formatCurrency: formatAmount,
    getCurrencySymbol: () => getCurrencySymbol(currency),
    transactions,
    debts,
    userSettings,
    updateSettings,
    presets,
    paymentMethods: userSettings.category_metadata?._payment_methods || DEFAULT_PAYMENT_METHODS,
    updatePresets,
    recurringBills,
    updateRecurringBills,
    baseIncome: Number(userSettings.base_income),
    savingsGoal: Number(userSettings.savings_goal),
    loading,
    bootstrapped,
    syncState,
    dataUnavailable,
    refreshAll,
    isOnline,
    wasSignedIn,
    uploadReceiptFile,
    addReceiptAttachment,
    addTransaction,
    addTransactions,
    deleteTransaction,
    updateTransaction,
    reimbursements,
    markTransactionsReimbursable,
    unmarkReimbursable,
    renameCategory,
    currentMonthTransactions,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    totalIncome,
    totalExpenses,
    balance,
    rolloverData: activeRolloverData,
    notifications,
    addNotification,
    markAllNotificationsRead,
    clearNotifications,
    addSavingsGoal,
    deleteSavingsGoal,
    updateSavingsGoalProgress,
    updateCategoryMetadata,
    getCategoryStyle,
    addDebt,
    recordDebtRepayment,
    updateDebt,
    deleteDebt,
    skippedBills,
    skipBillForMonth,
    unskipBillForMonth,
    rescheduleNotifications,
    showToast,
    showConfirm,
    updateAvailable,
    updateDismissed,
    dismissUpdate,
    themeMode,
    toggleThemeMode,
    highlightedBill,
    setHighlightedBill,
    isOnboardingNeeded
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <ConfirmDialog {...confirmDialog} onCancel={hideConfirm} />
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-alert toast-${t.type}`}>
            <div className="toast-icon">
              {t.type === 'success' && '✨'}
              {t.type === 'error' && '🛑'}
              {t.type === 'warning' && '⚠️'}
              {t.type === 'info' && 'ℹ️'}
            </div>
            <div className="toast-message">{t.message}</div>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action.onClick();
                  setToasts(prev => prev.filter(item => item.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} aria-label="Close">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};
