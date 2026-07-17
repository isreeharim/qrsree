import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Trash2, Eye, Search, ShieldAlert, ShieldCheck,
  QrCode, Settings, Power, ExternalLink, ScanLine,
  ToggleLeft, ToggleRight, Save, RefreshCw
} from 'lucide-react';
import { getAllUsers, deleteUser, updateUserRole, getSystemSettings, updateSystemSettings } from '../api/users';
import { getAllQrCodes, deleteQrCode, toggleQrStatus } from '../api/qr';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'qrcodes', label: 'All QR Codes', icon: QrCode },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function UserList() {
  const [activeTab, setActiveTab] = useState('users');

  // --- Users state ---
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // --- QR Codes state ---
  const [qrCodes, setQrCodes] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrSearch, setQrSearch] = useState('');
  const [qrDeleteTarget, setQrDeleteTarget] = useState(null);
  const [qrDeleting, setQrDeleting] = useState(false);
  const [qrTogglingId, setQrTogglingId] = useState(null);

  // --- Settings state ---
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const toast = useToast();
  const { user: currentUser } = useAuth();

  // --- Load Users ---
  const loadUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // --- Load QR codes when tab activates ---
  const loadQrCodes = useCallback(async () => {
    if (qrLoaded) return;
    setQrLoading(true);
    try {
      const data = await getAllQrCodes();
      setQrCodes(data);
      setQrLoaded(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load QR codes');
    } finally {
      setQrLoading(false);
    }
  }, [qrLoaded, toast]);

  // --- Load Settings when tab activates ---
  const loadSettings = useCallback(async () => {
    if (settingsLoaded) return;
    setSettingsLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
      setSettingsLoaded(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [settingsLoaded, toast]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'qrcodes') loadQrCodes();
    if (tabId === 'settings') loadSettings();
  };

  // --- User handlers ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success('User deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setUpdatingId(targetUser.id);
    try {
      const updated = await updateUserRole(targetUser.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: updated.role } : u)));
      toast.success(`Role updated to ${updated.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  // --- QR handlers ---
  const handleQrDelete = async () => {
    if (!qrDeleteTarget) return;
    setQrDeleting(true);
    try {
      await deleteQrCode(qrDeleteTarget.id);
      setQrCodes((prev) => prev.filter((q) => q.id !== qrDeleteTarget.id));
      toast.success('QR code deleted');
      setQrDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete QR code');
    } finally {
      setQrDeleting(false);
    }
  };

  const handleQrToggle = async (qr) => {
    setQrTogglingId(qr.id);
    try {
      const updated = await toggleQrStatus(qr.id);
      setQrCodes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      toast.success(updated.isActive ? 'QR code enabled' : 'QR code disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle QR code status');
    } finally {
      setQrTogglingId(null);
    }
  };

  // --- Settings handlers ---
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await updateSystemSettings({
        allowSelfRegistration: settings.allowSelfRegistration,
        maxQrLimitPerUser: settings.maxQrLimitPerUser,
      });
      setSettings(updated);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQrCodes = qrCodes.filter(
    (q) =>
      q.title.toLowerCase().includes(qrSearch.toLowerCase()) ||
      q.shortCode.toLowerCase().includes(qrSearch.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-900 p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════ USERS TAB ═══════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
            </p>
            <div className="relative max-w-xs w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-950 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {usersLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-navy-600 p-14 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-navy-600" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">No users found</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-navy-700 text-slate-500 dark:text-slate-400">
                      <th className="px-5 py-3.5 font-medium">User</th>
                      <th className="px-5 py-3.5 font-medium">Email</th>
                      <th className="px-5 py-3.5 font-medium">Department</th>
                      <th className="px-5 py-3.5 font-medium">Role</th>
                      <th className="px-5 py-3.5 font-medium">QRs</th>
                      <th className="px-5 py-3.5 font-medium">Joined</th>
                      <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 dark:border-navy-700/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-navy-700/20">
                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{u.username}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{u.department || '—'}</td>
                        <td className="px-5 py-4">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                              <ShieldAlert className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                              <ShieldCheck className="h-3 w-3" /> User
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">{u.qrCount}</td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/users/${u.id}`} title="View user" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-navy-700 dark:hover:text-slate-200 transition-colors">
                              <Eye className="h-4 w-4" />
                            </Link>
                            {u.id !== currentUser?.id && (
                              <>
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  disabled={updatingId === u.id}
                                  className="rounded-lg border border-slate-200 dark:border-navy-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                                >
                                  {updatingId === u.id ? '...' : u.role === 'admin' ? 'Make User' : 'Make Admin'}
                                </button>
                                <button onClick={() => setDeleteTarget(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-navy-700 transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ QR CODES TAB ═══════════════ */}
      {activeTab === 'qrcodes' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredQrCodes.length} QR code{filteredQrCodes.length === 1 ? '' : 's'} in system
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setQrLoading(true);
                  setQrLoaded(false);
                  try {
                    const data = await getAllQrCodes();
                    setQrCodes(data);
                    setQrLoaded(true);
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to refresh QR codes');
                  } finally {
                    setQrLoading(false);
                  }
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <div className="relative max-w-xs w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title or short code..."
                  value={qrSearch}
                  onChange={(e) => setQrSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-950 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {qrLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : filteredQrCodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-navy-600 p-14 text-center">
              <QrCode className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-navy-600" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">No QR codes found</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-navy-700 text-slate-500 dark:text-slate-400">
                      <th className="px-5 py-3.5 font-medium">Title</th>
                      <th className="px-5 py-3.5 font-medium">Short Code</th>
                      <th className="px-5 py-3.5 font-medium">Owner</th>
                      <th className="px-5 py-3.5 font-medium">Scans</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">Expires</th>
                      <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQrCodes.map((qr) => (
                      <tr key={qr.id} className="border-b border-slate-50 dark:border-navy-700/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-navy-700/20">
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 dark:text-white truncate max-w-[160px]">{qr.title}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[160px]">{qr.destinationUrl}</div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-teal-600 dark:text-teal-400">/q/{qr.shortCode}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {qr.createdBy?.username || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <ScanLine className="h-3.5 w-3.5" />
                            {qr.scanCount}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {qr.isActive ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">Disabled</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {qr.expiresAt ? (
                            <span className={new Date() > new Date(qr.expiresAt) ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}>
                              {formatDate(qr.expiresAt)}
                              {new Date() > new Date(qr.expiresAt) && ' (Exp)'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/qrcodes/${qr.id}`} title="View QR details" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-navy-700 dark:hover:text-slate-200 transition-colors">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleQrToggle(qr)}
                              disabled={qrTogglingId === qr.id}
                              title={qr.isActive ? 'Disable' : 'Enable'}
                              className={`rounded-lg p-1.5 transition-colors ${qr.isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button onClick={() => setQrDeleteTarget(qr)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-navy-700 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ SETTINGS TAB ═══════════════ */}
      {activeTab === 'settings' && (
        <div className="space-y-5 max-w-2xl">
          {settingsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : settings ? (
            <>
              <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-navy-700 px-6 py-4">
                  <h3 className="font-display font-semibold text-slate-900 dark:text-white">Global System Settings</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These settings apply to all users in the system.</p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-navy-700">
                  {/* Toggle: Self Registration */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Allow Self-Registration</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        When disabled, new users cannot sign up. Existing users are unaffected.
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, allowSelfRegistration: !s.allowSelfRegistration }))}
                      className="flex-shrink-0 ml-4 transition-colors"
                    >
                      {settings.allowSelfRegistration ? (
                        <ToggleRight className="h-9 w-9 text-teal-500" />
                      ) : (
                        <ToggleLeft className="h-9 w-9 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Input: Max QR Limit */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Max QR Codes per User</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Maximum number of QR codes a standard (non-admin) user can create. Admins are unlimited.
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={settings.maxQrLimitPerUser}
                        onChange={(e) => setSettings((s) => ({ ...s, maxQrLimitPerUser: parseInt(e.target.value) || 1 }))}
                        className="w-24 rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-center font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 dark:border-navy-700 px-6 py-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingSettings ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* --- Confirm Dialogs --- */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete user account?"
          message={`Are you sure you want to delete "${deleteTarget.username}"? This will permanently delete their account, all ${deleteTarget.qrCount} of their QR codes, and all associated scan history.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {qrDeleteTarget && (
        <ConfirmDialog
          open={!!qrDeleteTarget}
          title="Delete this QR code?"
          message={`"${qrDeleteTarget.title}" and all of its scan history will be permanently removed.`}
          onConfirm={handleQrDelete}
          onCancel={() => setQrDeleteTarget(null)}
          loading={qrDeleting}
        />
      )}
    </div>
  );
}
