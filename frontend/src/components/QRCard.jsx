import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ScanLine, Pencil, Trash2, ExternalLink } from 'lucide-react';

export default function QRCard({ qr, onEdit, onDelete }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-5 shadow-sm hover:shadow-md hover:border-teal-500/40 transition-all">
      <Link to={`/qrcodes/${qr.id}`} className="flex gap-4">
        <div className="flex-shrink-0 rounded-lg bg-white p-2 ring-1 ring-slate-200 h-fit">
          <QRCodeCanvas value={qr.shortUrl} size={56} level="M" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display font-semibold text-slate-900 dark:text-white">
            {qr.title}
          </h3>
          <p className="mt-0.5 truncate text-xs font-mono text-teal-600 dark:text-teal-400">
            /q/{qr.shortCode}
          </p>
          <p className="mt-2 truncate text-sm text-slate-500 dark:text-slate-400">
            {qr.destinationUrl}
          </p>
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-navy-700 pt-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <ScanLine className="h-4 w-4" />
          <span className="font-medium text-slate-700 dark:text-slate-200">{qr.scanCount}</span>
          scans
        </div>

        <div className="flex items-center gap-1">
          <a
            href={qr.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open destination"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-navy-700 dark:hover:text-slate-200 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => onEdit(qr)}
            title="Edit destination"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600 dark:hover:bg-navy-700 dark:hover:text-teal-400 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(qr)}
            title="Delete"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-navy-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
