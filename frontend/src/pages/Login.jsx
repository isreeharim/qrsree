import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome back');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy-950 px-4 overflow-hidden">
      {/* Ambient background glows */}
      <div className="module-grid absolute inset-0 text-teal-500/[0.04]" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-scale-in">
        <Link to="/" className="mb-8 flex flex-col items-center group cursor-pointer text-center">
          <div className="grid grid-cols-3 gap-[3px] h-10 w-10 mb-4 group-hover:rotate-12 transition-transform duration-300">
            {[1, 0, 1, 0, 1, 1, 1, 0, 1].map((filled, i) => (
              <span key={i} className={`rounded-sm ${filled ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,250,200,0.4)]' : 'bg-transparent'}`} />
            ))}
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-teal-400 transition-colors">
            QR Manager
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your dynamic QR codes
          </p>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-navy-700/60 bg-navy-900/60 p-8 shadow-2xl backdrop-blur-md"
        >
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400 animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Username
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-navy-600/70 bg-navy-950/50 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all outline-none"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-navy-600/70 bg-navy-950/50 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-navy-950 hover:bg-teal-400 hover:shadow-[0_0_20px_rgba(20,250,200,0.25)] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300 transition-colors">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
