import { NavLink } from 'react-router-dom';
import { LayoutDashboard, QrCode, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/qrcodes', label: 'QR Codes', icon: QrCode },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2.5">
            <QrLogoMark />
            <span className="font-display font-semibold text-slate-900 dark:text-white tracking-tight">
              QR Manager
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full border-t border-slate-200 dark:border-navy-700 p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-500 text-xs font-semibold text-white">
              {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {user?.username || 'Admin'}
              </p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// Small QR-module glyph used as the app's logo mark — a nod to the
// literal subject matter without turning every screen into a QR pattern.
function QrLogoMark() {
  const cells = [1, 0, 1, 0, 1, 1, 1, 0, 1];
  return (
    <div className="grid grid-cols-3 gap-[2px] h-6 w-6 flex-shrink-0">
      {cells.map((filled, i) => (
        <span
          key={i}
          className={`rounded-[1px] ${filled ? 'bg-teal-500' : 'bg-transparent'}`}
        />
      ))}
    </div>
  );
}
