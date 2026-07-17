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

      <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 px-5 py-4">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white">
            Recent scans
          </h2>
          <Link
            to="/qrcodes"
            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            View all QR codes
          </Link>
        </div>

        {stats.recentScans.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No scans yet. Once someone scans a QR code, activity shows up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-700 text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">QR code</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">GPS</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-slate-50 dark:border-navy-700/60 last:border-0"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {scan.qrTitle}
                      </div>
                      <div className="font-mono text-xs text-teal-600 dark:text-teal-400">
                        /q/{scan.shortCode}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {scan.city}, {scan.state}, {scan.country}
                    </td>
                    <td className="px-5 py-3">
                      {scan.latitude != null ? (
                        <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400">
                          <MapPin className="h-3.5 w-3.5" /> Captured
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
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
