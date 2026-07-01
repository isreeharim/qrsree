import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-navy-950 px-4 text-center">
      <p className="font-display text-5xl font-bold text-teal-500">404</p>
      <h1 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
