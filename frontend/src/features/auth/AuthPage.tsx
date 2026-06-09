import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/api';

export function AuthPage() {
  const { login, register } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-chalk/12 bg-turf-900/60 px-4 py-3 text-chalk placeholder:text-haze transition-colors focus:border-lime/60 focus:outline-none';

  return (
    <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ── Hero ── */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lime/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px crease-line opacity-60" />
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-lime/25 blur-[6px]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-lime shadow-[0_0_12px_2px_rgba(185,247,62,0.8)]" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Floodlit</span>
        </div>

        <div className="max-w-lg">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime/80">
            Night-match booking
          </p>
          <h1 className="mt-5 font-display text-6xl font-bold leading-[0.95] tracking-tight text-balance">
            Claim your <span className="text-lime">over.</span> Before someone else does.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-chalk-dim">
            Live availability across every pitch. Reserve a slot, hold it for two minutes,
            confirm before the floodlights fade.
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs text-haze">
          <span>3 PITCHES</span>
          <span className="h-1 w-1 rounded-full bg-haze" />
          <span>HOURLY SLOTS</span>
          <span className="h-1 w-1 rounded-full bg-haze" />
          <span>REAL-TIME</span>
        </div>
      </section>

      {/* ── Form ── */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-2xl font-bold">Floodlit</span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Get on the team'}
          </h2>
          <p className="mt-2 text-sm text-chalk-dim">
            {mode === 'login'
              ? 'Log in to book your next session.'
              : 'Create an account to start booking pitches.'}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-haze">
                  Name
                </label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Virat Kohli"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-haze">
                Email
              </label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-haze">
                Password
              </label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="group relative w-full overflow-hidden rounded-xl bg-lime py-3.5 font-semibold text-turf-950 transition-transform active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-chalk-dim">
            {mode === 'login' ? "Don't have an account?" : 'Already have one?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-lime underline-offset-4 hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
