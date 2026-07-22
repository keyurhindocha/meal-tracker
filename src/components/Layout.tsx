import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { UtensilsCrossed, Calendar, CalendarDays, BarChart3, /* Sparkles, */ LogOut } from 'lucide-react';
import { supabase } from '../supabase';

const navItems = [
  { to: '/history', icon: Calendar, label: 'History' },
  { to: '/', icon: UtensilsCrossed, label: 'Today' },
  { to: '/overview', icon: CalendarDays, label: 'Overview' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  // { to: '/suggest', icon: Sparkles, label: 'Suggest' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Glass-morphic sticky header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-3 md:px-8 md:py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/30 blur-xl rounded-full" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Meal Tracker</h1>
              <p className="hidden md:block text-xs text-slate-500">Log, analyze, discover</p>
            </div>
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col gap-1 p-4 w-56 shrink-0 sticky top-[73px] self-start">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Main content area */}
        <main key={location.pathname} className="flex-1 p-4 md:p-8 pb-28 md:pb-8 page-enter">
          <Outlet />
        </main>
      </div>

      {/* Mobile floating pill nav */}
      <nav className="md:hidden fixed bottom-safe left-3 right-3 z-30">
        <div className="backdrop-blur-xl bg-white/85 border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-900/5 flex pb-safe pt-1.5 px-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'text-slate-400 active:bg-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
