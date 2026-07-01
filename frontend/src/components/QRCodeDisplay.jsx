import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';
import { downloadCanvasAsPng, slugifyFilename } from '../utils/downloadQR';

/**
 * Renders the QR code for a given short URL and lets the admin download
 * it as a PNG. The QR always encodes the short URL — never the
 * destination — so it never needs regenerating when the destination
 * changes.
 */
export default function QRCodeDisplay({ shortUrl, title, size = 180 }) {
  const wrapperRef = useRef(null);

  const handleDownload = () => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    downloadCanvasAsPng(canvas, `${slugifyFilename(title)}-qr`);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wrapperRef}
        className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
      >
        <QRCodeCanvas value={shortUrl} size={size} level="M" includeMargin={false} />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-navy-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Download PNG
      </button>
    </div>
  );
}
