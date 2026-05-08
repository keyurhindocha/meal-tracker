# Meal Tracker

A responsive web app for logging your daily meals (breakfast, lunch, dinner), browsing your eating history, visualizing patterns with rich analytics, and getting AI-powered meal recommendations from Google Gemini. Data is stored per-user in Supabase with Row Level Security, so it syncs across all your devices.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Clone and install](#1-clone-and-install)
  - [2. Create a Supabase project](#2-create-a-supabase-project)
  - [3. Run the database migration](#3-run-the-database-migration)
  - [4. (Optional) Get a Google Gemini API key](#4-optional-get-a-google-gemini-api-key)
  - [5. Configure environment variables](#5-configure-environment-variables)
  - [6. Run the dev server](#6-run-the-dev-server)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Seeding Sample Data](#seeding-sample-data)
- [Deployment](#deployment)
- [Scripts Reference](#scripts-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Authentication
- Email + password sign-up and sign-in via Supabase Auth
- Sessions persist across reloads; auth state is provided to the app via React Context
- Each user only sees their own meal data (enforced by Postgres Row Level Security)

### Daily Meal Logging
- Log breakfast, lunch, and dinner for any date
- Navigate between days with intuitive date controls
- Autocomplete suggestions powered by your meal history
- Inline editing and deletion
- Daily summary showing how many meals are logged

### Meal History
- Browse history week by week
- Desktop: clean table view with color-coded meal-type badges
- Mobile: stacked card layout optimized for small screens
- Quick-jump to the current week; today's row is highlighted

### Overview Dashboard
- At-a-glance summary of recent activity, current streak, and completion rate

### Analytics & Charts
- **Stat cards**: total meals logged, unique meals, most common meal, longest gap, current streak, and completion rate
- **Most Eaten Meals** — horizontal bar chart (top 10)
- **Meals by Type** — donut chart with percentage labels
- **Weekly Logging Trend** — line chart over the last 12 weeks
- **Haven't Had in a While** — ranked list with color-coded urgency (green < 7 days, amber 7–14 days, red > 14 days)
- **Top Meal by Type** — your most-logged breakfast / lunch / dinner

### AI Meal Suggestions
- Powered by **Google Gemini 2.5 Flash**
- Analyzes your last 30 meal entries for context
- Generates 5 personalized suggestions per meal type
- Prioritizes variety and avoids recent repeats
- Supports optional dietary preferences (e.g., "vegetarian", "high protein", "Korean food")

---

## Tech Stack

| Layer          | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| Framework      | [React 19](https://react.dev) + TypeScript                  |
| Build Tool     | [Vite 7](https://vite.dev)                                  |
| Styling        | [Tailwind CSS 4](https://tailwindcss.com) (Vite plugin)     |
| Charts         | [Recharts 3](https://recharts.org)                          |
| Icons          | [Lucide React](https://lucide.dev)                          |
| Routing        | [React Router 7](https://reactrouter.com)                   |
| Date Utilities | [date-fns 4](https://date-fns.org)                          |
| Backend        | [Supabase](https://supabase.com) (Postgres + Auth + RLS)    |
| AI             | [Google Generative AI SDK](https://ai.google.dev) (Gemini)  |

---

## Architecture Overview

```
┌──────────────────────┐
│  React SPA (Vite)    │
│  ─ AuthContext       │
│  ─ Pages / Charts    │
│  ─ supabase-js       │──── HTTPS (PostgREST + Auth) ────┐
└──────────────────────┘                                  │
         │                                                ▼
         │                                    ┌──────────────────────┐
         │                                    │  Supabase            │
         │                                    │  ─ Postgres          │
         │                                    │  ─ Row Level Sec.    │
         │                                    │  ─ Auth (JWT)        │
         │                                    └──────────────────────┘
         │
         └────── HTTPS ──────► Google Generative AI (Gemini)
```

- **All reads/writes go through `supabase-js`**, which uses your `anon` key plus the user's JWT. RLS policies on `meal_entries` ensure users can only see/modify their own rows.
- **The Gemini call is made directly from the browser**, which means the API key is exposed in the production bundle. See [Deployment](#deployment) for how to address this for public deploys.

---

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- A **Supabase account** (free tier is fine — [supabase.com](https://supabase.com))
- *(Optional)* A **Google Gemini API key** for the AI suggestions page (free tier available at [ai.google.dev](https://ai.google.dev))

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/meal-tracker.git
cd meal-tracker
npm install
```

### 2. Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. Once it's provisioned, open **Project Settings → API** and copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY`

> The `anon` key is safe to ship in the browser bundle. RLS policies (set up in the next step) are what actually protect data.

### 3. Run the database migration

The migration in [supabase/migrations/00001_create_meal_entries.sql](supabase/migrations/00001_create_meal_entries.sql) creates the `meal_entries` table, indexes, and RLS policies.

**Option A — Supabase Dashboard (easiest):**
1. In your Supabase project, open the **SQL Editor**.
2. Paste the contents of `supabase/migrations/00001_create_meal_entries.sql`.
3. Click **Run**.

**Option B — Supabase CLI:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### 4. (Optional) Get a Google Gemini API key

If you want the AI Suggest page to work:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API key.
3. Save it for the next step.

The rest of the app works perfectly without this — the AI Suggest page will just show a config-required message.

### 5. Configure environment variables

Copy the example file and fill in the values you collected above:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here   # optional
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 6. Run the dev server

```bash
npm run dev
```

Open **http://localhost:5173**, sign up with any email + password, and start logging meals.

> Supabase sends a confirmation email by default. To skip this for local dev, go to **Auth → Providers → Email** in the Supabase dashboard and disable "Confirm email".

---

## Project Structure

```
meal_tracker/
├── index.html                       # HTML entry point
├── vite.config.ts                   # Vite + React + Tailwind plugins
├── .env.example                     # Template for env vars
├── package.json
├── tsconfig.json
├── scripts/
│   ├── seed.mjs                     # Bulk-insert sample meals via supabase-js
│   └── seed.sql                     # Same data as raw SQL (alternative path)
├── supabase/
│   └── migrations/
│       └── 00001_create_meal_entries.sql
└── src/
    ├── main.tsx                     # React DOM entry point
    ├── App.tsx                      # Auth-gated route definitions
    ├── AuthContext.tsx              # Supabase auth provider + hook
    ├── supabase.ts                  # Typed supabase-js client
    ├── storage.ts                   # Data layer + analytics queries
    ├── gemini.ts                    # Google Gemini API integration
    ├── types.ts                     # TypeScript types + Database type
    ├── index.css                    # Tailwind imports + custom theme
    ├── components/
    │   ├── Layout.tsx               # App shell, header, sidebar, mobile nav
    │   └── MealCard.tsx             # Meal entry card with edit/delete
    └── pages/
        ├── LoginPage.tsx            # Sign-in / sign-up form
        ├── TodayPage.tsx            # Daily meal logging
        ├── HistoryPage.tsx          # Weekly history browser
        ├── OverviewPage.tsx         # At-a-glance dashboard
        ├── AnalyticsPage.tsx        # Charts and statistics
        └── SuggestPage.tsx          # AI-powered recommendations
```

---

## Environment Variables

| Variable                  | Required | Description                                                   |
| ------------------------- | -------- | ------------------------------------------------------------- |
| `VITE_SUPABASE_URL`       | Yes      | Your Supabase project URL                                     |
| `VITE_SUPABASE_ANON_KEY`  | Yes      | Supabase `anon` (public) key — safe to expose in the browser  |
| `VITE_GEMINI_API_KEY`     | No       | Google Gemini API key. Without it, only the AI page is gated. |

> Variables prefixed with `VITE_` are bundled into the client at build time. **Do not put service-role keys or secrets there.** See [Deployment](#deployment) for the implication for the Gemini key.

---

## Database Schema

A single table, fully isolated per user via RLS:

```sql
create table public.meal_entries (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  date       text        not null,   -- YYYY-MM-DD
  type       text        not null check (type in ('breakfast', 'lunch', 'dinner')),
  name       text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, date, type)       -- one entry per user/date/meal-type
);
```

RLS policies enforce that `auth.uid() = user_id` for all SELECT / INSERT / UPDATE / DELETE operations.

---

## Seeding Sample Data

Want to populate your account with a few weeks of test meals? After signing up at least once, run:

```bash
node scripts/seed.mjs <your-email> <your-password>
```

The script signs in via the Supabase JS client, then upserts ~50 meal entries dated over the last few weeks. Useful for trying the analytics charts without weeks of real logging.

If you'd rather edit the meals first, open [scripts/seed.mjs](scripts/seed.mjs) and modify the `meals` array.

---

## Deployment

The app is a static SPA, so it works on any static host: **Vercel**, **Netlify**, **Cloudflare Pages**, **GitHub Pages**, etc.

```bash
npm run build           # outputs to dist/
npm run preview         # serve dist/ locally for a final check
```

Then point your host at `dist/` and set the same three environment variables you used locally.

### Important: the Gemini API key is exposed in the bundle

Because the SDK runs in the browser and the variable is `VITE_*`, **`VITE_GEMINI_API_KEY` is embedded in the built JavaScript**. Anyone who opens devtools on a deployed instance can extract it. For a personal deployment that's only accessed by you, this may be fine. For a public-facing deployment, you should:

1. **Remove `VITE_GEMINI_API_KEY` from the client.**
2. **Add a small server-side proxy** (e.g., a Vercel/Netlify serverless function or a Supabase Edge Function) that holds the key and forwards prompts to Gemini.
3. **Update [src/gemini.ts](src/gemini.ts)** to call your proxy endpoint instead of the SDK directly.

The Supabase `anon` key is fine to expose — that's its design.

---

## Scripts Reference

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start Vite dev server with hot reload    |
| `npm run build`   | Type-check and build for production      |
| `npm run preview` | Serve the production build locally       |
| `npm run lint`    | Run ESLint across the project            |

---

## Troubleshooting

**"Invalid API key" on sign-in**
Double-check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` match the values in **Supabase → Project Settings → API**. Restart the dev server after editing `.env` — Vite only loads env vars at startup.

**Sign-up never finishes / no email arrives**
Supabase requires email confirmation by default. Either check your inbox (including spam) or disable confirmation in **Auth → Providers → Email** for local development.

**"relation 'public.meal_entries' does not exist"**
The migration hasn't run yet. See [Step 3](#3-run-the-database-migration).

**AI Suggest page shows a "key not configured" banner**
Add `VITE_GEMINI_API_KEY` to your `.env` and restart `npm run dev`.

**Empty charts on the Analytics page**
You probably haven't logged enough meals yet. Try the [seed script](#seeding-sample-data) to populate a few weeks of sample data.

---

## Contributing

This started as a personal project, but PRs and issue reports are welcome. If you're submitting a change:

1. Open an issue first for anything beyond a small fix, so we can agree on direction.
2. Run `npm run lint` and `npm run build` before pushing — both should pass clean.
3. Keep PRs focused; one feature or fix per PR.

---

## License

MIT — see [LICENSE](LICENSE) for details. Use it, fork it, modify it, ship your own version.
