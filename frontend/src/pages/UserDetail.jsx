import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, ShieldAlert, ShieldCheck, QrCode as QrCodeIcon, Briefcase } from 'lucide-react';
import { getUserById } from '../api/users';
import { updateQrCode, deleteQrCode, toggleQrStatus } from '../api/qr';
import QRCard from '../components/QRCard';
import QRFormModal from '../components/QRFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';

function formatTimestamp(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, mode: 'edit', data: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const data = await getUserById(id);
      setUserDetail(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleEditSubmit = async (payload) => {
    try {
      const updated = await updateQrCode(modalState.data.id, payload);
      setUserDetail((prev) => ({
        ...prev,
        qrCodes: prev.qrCodes.map((qr) => (qr.id === updated.id ? { ...qr, ...updated } : qr)),
      }));
      toast.success('Destination URL updated');
      setModalState({ open: false, mode: 'edit', data: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update QR code');
    }
  };

  const handleToggle = async (qr) => {
    try {
      const updated = await toggleQrStatus(qr.id);
      setUserDetail((prev) => ({
        ...prev,
        qrCodes: prev.qrCodes.map((q) => (q.id === updated.id ? { ...q, isActive: updated.isActive } : q)),
      }));
      toast.success(updated.isActive ? 'QR code enabled' : 'QR code disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle QR code status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQrCode(deleteTarget.id);
      setUserDetail((prev) => ({
        ...prev,
        qrCodes: prev.qrCodes.filter((qr) => qr.id !== deleteTarget.id),
      }));
      toast.success('QR code deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete QR code');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!userDetail) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div className="rounded-2xl border border-slate-200/60 dark:border-navy-700/60 bg-white/70 dark:bg-navy-800/60 backdrop-blur-md p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {userDetail.username || '—'}
            </h2>
            {userDetail.role === 'admin' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <ShieldAlert className="h-3 w-3" /> Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                <ShieldCheck className="h-3 w-3" /> User
              </span>
            )}
          </div>
          
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {userDetail.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              {userDetail.department || '—'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Joined {formatTimestamp(userDetail.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="border-t md:border-t-0 md:border-l border-slate-100 dark:border-navy-700/60 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">QR Codes Generated</p>
          <p className="text-3xl font-display font-semibold text-slate-900 dark:text-white mt-1">
            {userDetail.qrCodes.length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white text-lg">
          QR Codes
        </h3>

        {userDetail.qrCodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-navy-600 p-14 text-center text-slate-400">
            <QrCodeIcon className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-navy-600" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">No QR codes yet</p>
            <p className="mt-1 text-sm">This user hasn't generated any dynamic QR codes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userDetail.qrCodes.map((qr) => (
              <QRCard
                key={qr.id}
                qr={qr}
                onEdit={(target) => setModalState({ open: true, mode: 'edit', data: target })}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      <QRFormModal
        open={modalState.open}
        mode={modalState.mode}
        initialData={modalState.data}
        onClose={() => setModalState({ open: false, mode: 'edit', data: null })}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this QR code?"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" and all of its scan history will be permanently removed. The QR code will stop working.`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
