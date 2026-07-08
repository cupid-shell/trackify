# Trackify

A personal expense tracker for daily, monthly, and yearly spending, built around a monthly budget and savings goal. It runs as a web app (PWA) and as a native Android app, with a Supabase backend for auth and data. Defaults target a Bangladesh user (BDT/৳, bKash), but the currency is configurable.

## Features

- Log income and expenses with categories, payment methods, notes, and presets
- Monthly budget tracking with per-category budgets and rollover
- Recurring bills with reminders and optional auto-logging
- Savings goals with progress tracking
- Debts ledger (money owed and lent, with repayments)
- Analytics: trends, category breakdowns, month-over-month comparison, a spending health score, and a prediction view
- Receipt attachments with an image lightbox
- CSV export and PDF statements
- Local notifications: daily reminders, weekly digest, budget and spend alerts, savings milestones
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
                          budgets, savings goals, notifications, currency
  components/             UI (dashboard, history, analytics, settings, ledger)
  utils/                  pure helpers (currency, ...)
  supabaseClient.js       Supabase client setup
*.sql                     database setup and migrations (run against Supabase)
android/                  Capacitor Android project
```

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
