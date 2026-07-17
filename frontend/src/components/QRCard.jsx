import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ScanLine, Pencil, Trash2, ExternalLink, Power } from 'lucide-react';

export default function QRCard({ qr, onEdit, onDelete, onToggle }) {
  return (
    <div className={`group relative flex flex-col rounded-2xl border bg-white/70 dark:bg-navy-800/60 backdrop-blur-md p-5 shadow-sm transition-all duration-300 ${
      qr.isActive
        ? 'border-slate-200/60 dark:border-navy-700/60 hover:border-teal-500/40 hover:shadow-[0_8px_30px_rgba(20,250,200,0.03)]'
        : 'border-red-200/40 dark:border-red-500/20 opacity-75'
    }`}>
      <Link to={`/qrcodes/${qr.id}`} className="flex gap-4">
        <div className={`flex-shrink-0 rounded-xl bg-white p-2 border transition-all duration-350 ${
          qr.isActive ? 'border-slate-100 dark:border-navy-700' : 'border-red-100 dark:border-red-500/20'
        }`}>
          <QRCodeCanvas value={qr.shortUrl} size={56} level="M" pixelRatio={1} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display font-bold text-slate-900 dark:text-white text-[15px] group-hover:text-teal-500 transition-colors">
              {qr.title}
            </h3>
            <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              qr.isActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
            }`}>
              {qr.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
          <p className="mt-1 truncate text-xs font-mono font-medium text-teal-600 dark:text-teal-400">
            /q/{qr.shortCode}
          </p>
          <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
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
          <button
            onClick={() => onToggle?.(qr)}
            title={qr.isActive ? 'Disable QR' : 'Enable QR'}
            className={`rounded-lg p-1.5 transition-colors ${
              qr.isActive
                ? 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10'
                : 'text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10'
            }`}
          >
            <Power className="h-4 w-4" />
          </button>
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
