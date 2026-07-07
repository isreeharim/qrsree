import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const emptyForm = { title: '', destinationUrl: '', expiresAt: '' };

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function QRFormModal({ open, mode = 'create', initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              title: initialData.title,
              destinationUrl: initialData.destinationUrl,
              expiresAt: formatDateForInput(initialData.expiresAt),
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, initialData]);

  if (!open) return null;

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.destinationUrl.trim()) {
      next.destinationUrl = 'Destination URL is required';
    } else {
      try {
        // eslint-disable-next-line no-new
        new URL(form.destinationUrl.trim());
      } catch {
        next.destinationUrl = 'Enter a full URL, including http:// or https://';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        destinationUrl: form.destinationUrl.trim(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-6 shadow-xl animate-scale-in"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {mode === 'create' ? 'Create QR code' : 'Edit destination'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Storefront poster"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="destinationUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Destination URL
            </label>
            <input
              id="destinationUrl"
              type="text"
              value={form.destinationUrl}
              onChange={(e) => setForm((f) => ({ ...f, destinationUrl: e.target.value }))}
              placeholder="https://example.com/landing-page"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-sans focus:border-teal-500"
            />
            {errors.destinationUrl && (
              <p className="mt-1 text-xs text-red-500">{errors.destinationUrl}</p>
            )}
            {mode === 'edit' && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                The printed QR code keeps working — only where it points will change.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="expiresAt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Expiration Date & Time (Optional)
            </label>
            <input
              id="expiresAt"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Saving…' : mode === 'create' ? 'Create QR code' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
