// Pure mapping from a raw `user_settings` database row to the in-memory
// userSettings shape. Extracted from AppContext so the *same* mapping is used by
// every path that produces settings: the initial fetch, the realtime handler for
// cross-tab/device updates, and (next) hydration from the offline cache. Keeping
// one implementation is the point — the realtime copy had already drifted and was
// silently dropping `currency`, resetting it whenever another tab saved settings.
//
// Pure so it runs under the plugin-free vitest config: no localStorage, no DOM,
// no network. Callers own the side effects (setState, localStorage, theme vars).

// Map a raw row to the userSettings object. `defaults` is the app's
// defaultSettings object, supplying every fallback.
//
// Column-vs-metadata precedence is deliberate and must be preserved: presets,
// recurring bills and notification prefs each live in a real column *and* under
// an `_`-prefixed key in the category_metadata JSON bag (the bag is the fallback
// for schemas that predate those columns). A present-but-null column falls
// through to metadata; only a missing metadata key falls through to defaults.
export const mapSettingsRow = (row, defaults) => {
  const categoryMetadata = row.category_metadata || {};

  const presets = row.presets !== undefined && row.presets !== null
    ? row.presets
    : (categoryMetadata._presets !== undefined ? categoryMetadata._presets : defaults.presets);

  const recurringBills = row.recurring_bills !== undefined && row.recurring_bills !== null
    ? row.recurring_bills
    : (categoryMetadata._recurring_bills !== undefined ? categoryMetadata._recurring_bills : defaults.recurring_bills);

  const notificationPrefs = row.notification_preferences !== undefined && row.notification_preferences !== null
    ? row.notification_preferences
    : (categoryMetadata._notification_preferences !== undefined ? categoryMetadata._notification_preferences : defaults.notification_preferences);

  return {
    base_income: row.base_income || defaults.base_income,
    savings_goal: row.savings_goal || defaults.savings_goal,
    expense_categories: row.expense_categories || defaults.expense_categories,
    income_categories: row.income_categories || defaults.income_categories,
    category_budgets: row.category_budgets || {},
    savings_goals: row.savings_goals || [],
    category_metadata: categoryMetadata,
    presets,
    recurring_bills: recurringBills,
    notification_preferences: notificationPrefs,
    // Currency lives only in the metadata bag — there is no column for it.
    currency: categoryMetadata._currency || defaults.currency,
  };
};

// Skipped recurring bills are metadata-only and are not part of userSettings —
// they drive their own state slice. Separate function so callers don't have to
// reach into the bag themselves.
export const readSkippedBills = (row) => (row?.category_metadata || {})._skipped_bills || [];
