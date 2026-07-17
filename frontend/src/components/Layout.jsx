import { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useIsMobile } from '../hooks/useIsMobile';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, QrCode, Users, LogOut, Sun, Moon } from 'lucide-react';

const titles = {
  '/dashboard': 'Dashboard',
  '/qrcodes': 'QR Codes',
  '/users': 'User Management',
};

function resolveTitle(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith('/qrcodes/')) return 'QR Code Details';
  if (pathname.startsWith('/users/')) return 'User Details';
  return 'QR Manager';
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const title = resolveTitle(location.pathname);

  if (isMobile) {
    const navItems = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/qrcodes', label: 'QR Codes', icon: QrCode },
      ...(isAdmin ? [{ to: '/users', label: 'Users', icon: Users }] : []),
    ];

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col pb-16">
        {/* Mobile Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/50 dark:border-navy-700/50 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-4 flex-shrink-0">
          <h1 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={logout}
              aria-label="Log out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Tab Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-slate-200/60 dark:border-navy-800/80 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md flex items-center justify-around px-4 pb-safe shadow-lg">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                    : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] tracking-tight">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 lg:ml-0">
          <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
