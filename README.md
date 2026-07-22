# Trackify

A personal expense tracker for daily, monthly, and yearly spending, built around a monthly budget and savings goal. It runs as a web app (PWA) and as a native Android app, with a Supabase backend for auth and data. Defaults target a Bangladesh user (BDT/৳, bKash), but the currency is configurable.

## Features

- Log income and expenses with categories, payment methods, notes, and presets
- Monthly budget tracking with per-category budgets and rollover
- Recurring bills with reminders and optional auto-logging
- Savings goals with progress tracking
- Debts ledger (money owed and lent, with repayments), including reimbursable expenses
- Analytics: trends, category breakdowns, month-over-month comparison, a spending health score, and a prediction view
- History with search, category, date-range and calendar-day filters, scoped to a month or to all time, with a running total for whatever is on screen
- Receipt attachments with an image lightbox
- CSV export (current month or all time), PDF statements, and CSV import with a preview that reports duplicates and unreadable rows before anything is written
- Works offline: cached data on load, and entries written while disconnected are queued and synced when the connection returns
- Alerts for budget thresholds, budget exhaustion, unusual spending spikes and savings milestones — in the app on every platform, and as system notifications on Android
- Scheduled reminders (daily log, weekly digest, monthly review) on the Android build
- Installable PWA and Android build via Capacitor

## Tech stack

- React 19, Vite 8, React Router 7
- recharts (charts), lucide-react (icons), date-fns
- Supabase (auth + Postgres, row-level security)
- Capacitor 8 for the Android build
- vite-plugin-pwa for offline/installable support

## Getting started

Requires Node.js (18+) and npm.

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run lint     # eslint + custom CSS validation
npm test         # run unit tests (Vitest)
```

### Environment variables

The Supabase client reads two variables, with hardcoded fallbacks in `src/supabaseClient.js`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The committed fallback is the Supabase *publishable* (anon) key, which is public by design and guarded by row-level security. To point at your own project, create a `.env` file with these two variables (`.env*` is gitignored).

## Project structure

```
src/
  App.jsx                routes and app shell
  context/AppContext.jsx central state: transactions, debts, settings,
                          budgets, savings goals, notifications, currency,
                          offline cache and write queue
  components/             UI (dashboard, history, analytics, settings, ledger)
  utils/                  pure, unit-tested helpers — money math, dates,
                          settings mapping, offline cache/queue, alert rules,
                          the History filter, CSV import/export
  supabaseClient.js       Supabase client setup
*.sql                     database setup and migrations (run against Supabase)
tools/                    build-time scripts (app icon generation)
android/                  Capacitor Android project
```

Logic worth trusting lives in `src/utils/` rather than inside components, so it can
be unit-tested directly — the test setup is deliberately plugin-free and runs in
Node, with no DOM. Each helper has a colocated `*.test.js`.

## Database

The SQL files at the repo root provision the Supabase schema:

- `supabase_setup.sql` — initial tables
- `migration.sql` — schema changes over time
- `debts_setup.sql` — debts/ledger tables

Run them against your Supabase project (SQL editor or CLI).

## Android

The app wraps the web build with Capacitor.

```bash
npm run build
npx cap sync android
```

Then open `android/` in Android Studio, or use the CI workflow at `.github/workflows/android-build.yml`.
