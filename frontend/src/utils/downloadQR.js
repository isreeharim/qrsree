/**
 * Downloads the contents of a <canvas> element as a PNG file.
 * Used with qrcode.react's QRCodeCanvas, which renders to an actual
 * canvas we can read pixel data from directly — no server round trip
 * needed to produce the downloadable image.
 */
export function downloadCanvasAsPng(canvas, filename) {
  if (!canvas) return;

  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Turns a QR title into a safe filename fragment.
 */
export function slugifyFilename(title) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'qr-code'
  );
}
