import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, QrCode as QrCodeIcon } from 'lucide-react';
import { getAllQrCodes, createQrCode, updateQrCode, deleteQrCode, toggleQrStatus } from '../api/qr';
import QRCard from '../components/QRCard';
import QRFormModal from '../components/QRFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';

export default function QRList() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, mode: 'create', data: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const loadQrCodes = useCallback(async () => {
    try {
      const data = await getAllQrCodes();
      setQrCodes(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadQrCodes();
  }, [loadQrCodes]);

  const handleCreateSubmit = async (payload) => {
    try {
      const created = await createQrCode(payload);
      toast.success('QR code created');
      setModalState({ open: false, mode: 'create', data: null });
      navigate(`/qrcodes/${created.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create QR code');
    }
  };

  const handleEditSubmit = async (payload) => {
    try {
      const updated = await updateQrCode(modalState.data.id, payload);
      setQrCodes((prev) => prev.map((qr) => (qr.id === updated.id ? updated : qr)));
      toast.success('Destination updated');
      setModalState({ open: false, mode: 'create', data: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update QR code');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQrCode(deleteTarget.id);
      setQrCodes((prev) => prev.filter((qr) => qr.id !== deleteTarget.id));
      toast.success('QR code deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete QR code');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (qr) => {
    try {
      const updated = await toggleQrStatus(qr.id);
      setQrCodes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      toast.success(updated.isActive ? 'QR code enabled' : 'QR code disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle QR code status');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {qrCodes.length} QR code{qrCodes.length === 1 ? '' : 's'} total
        </p>
        <button
          onClick={() => setModalState({ open: true, mode: 'create', data: null })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          New QR code
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : qrCodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200/80 dark:border-navy-700/60 bg-white/40 dark:bg-navy-900/20 backdrop-blur-sm p-16 text-center text-slate-400">
          <QrCodeIcon className="mx-auto mb-3 h-10 w-10 text-slate-350 dark:text-navy-600" />
          <p className="text-slate-650 dark:text-slate-300 font-semibold">No dynamic QR codes yet</p>
          <p className="mt-1 text-sm text-slate-450 dark:text-slate-500">Create one to get started with editable links and scan statistics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr) => (
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

      <QRFormModal
        open={modalState.open}
        mode={modalState.mode}
        initialData={modalState.data}
        onClose={() => setModalState({ open: false, mode: 'create', data: null })}
        onSubmit={modalState.mode === 'create' ? handleCreateSubmit : handleEditSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this QR code?"
        message={`"${deleteTarget?.title}" and all of its scan history will be permanently removed. Any printed copies will stop working.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
