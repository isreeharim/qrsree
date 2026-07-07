import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Copy, ScanLine, MapPin, Power, Download, Clock } from 'lucide-react';
import { getQrCodeById, updateQrCode, deleteQrCode, getScanHistory, toggleQrStatus, getExportScansUrl } from '../api/qr';
import QRCodeDisplay from '../components/QRCodeDisplay';
import QRFormModal from '../components/QRFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function QRDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [qr, setQr] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [qrData, scanData] = await Promise.all([getQrCodeById(id), getScanHistory(id)]);
      setQr(qrData);
      setScans(scanData);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load QR code');
      navigate('/qrcodes');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEditSubmit = async (payload) => {
    try {
      const updated = await updateQrCode(id, payload);
      setQr(updated);
      toast.success('Destination updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update QR code');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteQrCode(id);
      toast.success('QR code deleted');
      navigate('/qrcodes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete QR code');
      setDeleting(false);
    }
  };

  const copyShortUrl = () => {
    navigator.clipboard.writeText(qr.shortUrl);
    toast.success('Short URL copied to clipboard');
  };

  const handleToggle = async () => {
    try {
      const updated = await toggleQrStatus(id);
      setQr(updated);
      toast.success(updated.isActive ? 'QR code enabled' : 'QR code disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!qr) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        to="/qrcodes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to QR codes
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* QR image + core details */}
        <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-sm">
          <QRCodeDisplay shortUrl={qr.shortUrl} title={qr.title} size={200} />

          <div className="mt-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {qr.title}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                qr.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {qr.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <button
              onClick={copyShortUrl}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-mono text-teal-600 dark:text-teal-400 hover:underline"
            >
              {qr.shortUrl}
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={handleToggle}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                qr.isActive
                  ? 'border-amber-200 dark:border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                  : 'border-emerald-200 dark:border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {qr.isActive ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-navy-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit destination
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Destination + scan history */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Current destination
            </p>
            <a
              href={qr.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              {qr.destinationUrl}
            </a>

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 dark:border-navy-700 pt-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {qr.scanCount}
                </span>
                total scans · created {new Date(qr.createdAt).toLocaleDateString()}
              </div>
              {qr.expiresAt && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  <span>
                    Expires: {new Date(qr.expiresAt).toLocaleString()}
                    {new Date() > new Date(qr.expiresAt) && ' (Expired)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm">
            <div className="border-b border-slate-100 dark:border-navy-700 px-5 py-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">
                Scan history
              </h3>
              {scans.length > 0 && (
                <a
                  href={getExportScansUrl(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </a>
              )}
            </div>

            {scans.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No scans recorded yet for this QR code.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-navy-800">
                    <tr className="border-b border-slate-100 dark:border-navy-700 text-slate-500 dark:text-slate-400">
                      <th className="px-5 py-3 font-medium">Location</th>
                      <th className="px-5 py-3 font-medium">GPS</th>
                      <th className="px-5 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map((scan) => (
                      <tr
                        key={scan._id}
                        className="border-b border-slate-50 dark:border-navy-700/60 last:border-0"
                      >
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {scan.city}, {scan.state}, {scan.country}
                        </td>
                        <td className="px-5 py-3">
                          {scan.latitude != null ? (
                            <a
                              href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              <MapPin className="h-3.5 w-3.5" /> View
                            </a>
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
      </div>

      <QRFormModal
        open={editOpen}
        mode="edit"
        initialData={qr}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this QR code?"
        message={`"${qr.title}" and all of its scan history will be permanently removed. Any printed copies will stop working.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
