import { NavLink } from 'react-router-dom';
import { LayoutDashboard, QrCode, Users, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ open, onClose }) {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/qrcodes', label: 'QR Codes', icon: QrCode },
    ...(isAdmin ? [{ to: '/users', label: 'Users', icon: Users }] : []),
  ];

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
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col h-full transform border-r border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 dark:border-navy-700 flex-shrink-0">
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

        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 p-3 scrollbar-thin">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold shadow-[inset_3px_0_0_#00c9a7] pl-4'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800/40 hover:text-slate-900 dark:hover:text-white pl-3'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 dark:border-navy-800 p-4 bg-white/50 dark:bg-navy-900/50 backdrop-blur-sm mt-auto flex-shrink-0">
          <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 text-xs font-bold text-white shadow-md shadow-teal-500/10">
              {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user?.username || 'Admin'}
              </p>
              <p className="truncate text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                {user?.role || 'user'}
              </p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-800"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function QrLogoMark() {
  const cells = [1, 0, 1, 0, 1, 1, 1, 0, 1];
  return (
    <div className="grid grid-cols-3 gap-[2px] h-6 w-6 flex-shrink-0">
      {cells.map((filled, i) => (
        <span
          key={i}
          className={`rounded-[1px] ${filled ? 'bg-teal-500 shadow-[0_0_6px_rgba(20,250,200,0.3)]' : 'bg-transparent'}`}
        />
      ))}
    </div>
  );
}
