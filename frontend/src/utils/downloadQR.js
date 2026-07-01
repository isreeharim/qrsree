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
 * Converts a DOM <svg> element to a high-resolution PNG file and downloads it.
 * This is extremely robust and avoids canvas display/animation/GPU clipping issues.
 */
export function downloadSvgAsPng(svgElement, filename, size = 512) {
  if (!svgElement) return;

  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    // Fill white background (QR codes require a white margin/background to scan)
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, size, size);

    // Draw the QR code SVG image onto the offscreen canvas
    context.drawImage(image, 0, 0, size, size);

    // Trigger download
    const pngURL = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngURL;
    downloadLink.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Revoke URL to free resources
    URL.revokeObjectURL(blobURL);
  };
  image.src = blobURL;
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
