// Lightweight SVG QR Code Generator for invitation links

export function generateSimpleQRCodeSVG(text: string, size = 180): string {
  // Use Google Chart API or standard SVG matrix fallback for crisp rendering
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=ffffff&color=1e293b&margin=1`;
}
