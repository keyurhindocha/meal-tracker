import { useState } from 'react';
import { UtensilsCrossed, Loader2, Mail, Lock, Coffee, Croissant, Apple, Salad } from 'lucide-react';
import { supabase } from '../supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email for a confirmation link!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl" />

      {/* Floating food icons */}
      <Coffee className="absolute top-[12%] left-[8%] w-14 h-14 text-amber-700/15 -rotate-12" strokeWidth={1.5} />
      <Croissant className="absolute top-[18%] right-[10%] w-16 h-16 text-amber-600/15 rotate-12" strokeWidth={1.5} />
      <Apple className="absolute bottom-[15%] left-[10%] w-16 h-16 text-rose-600/15 rotate-6" strokeWidth={1.5} />
      <Salad className="absolute bottom-[20%] right-[8%] w-14 h-14 text-emerald-700/15 -rotate-6" strokeWidth={1.5} />

      <div className="relative w-full max-w-sm scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meal Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Log, analyze, discover</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 card-soft">
          <h2 className="text-lg font-bold text-slate-900 mb-5">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm scale-in">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm scale-in">
              {message}
            </div>
          )}

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Email</label>
          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            />
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Password</label>
          <div className="relative mb-5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignUp ? 'Create account' : 'Sign in'}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              className="text-primary-600 font-semibold hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
