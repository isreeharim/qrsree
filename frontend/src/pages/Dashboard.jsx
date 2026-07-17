import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, ScanLine, MapPin, Users } from 'lucide-react';
import { getDashboardStats } from '../api/dashboard';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { isAdmin } = useAuth();

  const loadStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!stats) return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-slate-500 dark:text-slate-400">Failed to load dashboard data. Please refresh the page.</p>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <StatCard
          label={isAdmin ? 'Total QR codes' : 'My QR codes'}
          value={stats.totalQrCodes}
          icon={QrCode}
          accent="teal"
        />
        <StatCard
          label={isAdmin ? 'Total scans' : 'My scans'}
          value={stats.totalScans}
          icon={ScanLine}
          accent="sky"
        />
        {isAdmin && stats.totalUsers !== undefined && (
          <StatCard
            label="Total users"
            value={stats.totalUsers}
            icon={Users}
            accent="purple"
          />
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/60 dark:border-navy-700/60 bg-white/70 dark:bg-navy-800/60 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 px-6 py-4.5">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white text-base">
            Recent activity logs
          </h2>
          <Link
            to="/qrcodes"
            className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors"
          >
            View all QR codes
          </Link>
        </div>

        {stats.recentScans.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-450 dark:text-slate-400">
              No scan logs captured yet. Dynamic QR activities will display here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-700 text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4.5 font-medium text-xs uppercase tracking-wider">QR Code</th>
                  <th className="px-6 py-4.5 font-medium text-xs uppercase tracking-wider">Geographic Region</th>
                  <th className="px-6 py-4.5 font-medium text-xs uppercase tracking-wider">GPS Coordinates</th>
                  <th className="px-6 py-4.5 font-medium text-xs uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-slate-50 dark:border-navy-700/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-navy-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {scan.qrTitle}
                      </div>
                      <div className="font-mono text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                        /q/{scan.shortCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-650 dark:text-slate-350 font-medium">
                      {scan.city}, {scan.state}, {scan.country}
                    </td>
                    <td className="px-6 py-4">
                      {scan.latitude != null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                          <MapPin className="h-3 w-3" /> GPS Logged
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                      {formatTimestamp(scan.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
