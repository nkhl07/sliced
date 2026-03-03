export async function generateTableQRCode(tableId: number | string): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const QRCode = (await import('qrcode')).default;
    const qr = await QRCode.toDataURL(`${window.location.origin}/menu?table=${tableId}`);
    return qr;
  } catch (err) {
    console.error('QR generation error:', err);
    return '';
  }
}
