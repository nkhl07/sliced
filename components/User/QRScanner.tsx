'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  mode?: 'table' | 'identity';
}

export default function QRScanner({ onScan, onClose, mode = 'table' }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');

        if (!mounted) return;

        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false,
        );

        scannerRef.current.render(
          (decodedText: string) => {
            if (!mounted) return;

            if (mode === 'identity') {
              scannerRef.current?.clear();
              onScan(decodedText);
              return;
            }

            try {
              const url = new URL(decodedText);
              const tableId = url.searchParams.get('table');
              if (tableId) {
                scannerRef.current?.clear();
                onScan(tableId);
              } else {
                setError('Invalid QR Code: Table ID not found.');
              }
            } catch {
              setError('Invalid QR Code format. Expected table URL.');
            }
          },
          () => {
            // Silently handle continuous scan errors
          },
        );
      } catch (err) {
        console.error('QR Scanner init error:', err);
      }
    };

    initScanner();

    return () => {
      mounted = false;
      scannerRef.current?.clear().catch(() => {});
    };
  }, [mode, onScan]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden relative">
        <div className="p-4 apple-red flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span className="font-bold uppercase tracking-widest text-sm">
              {mode === 'identity' ? 'Verify Identity' : 'Scan Table QR'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-stone-200" />

          {error && (
            <p className="mt-4 text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <div className="mt-6 text-center">
            <p className="text-stone-500 text-xs leading-relaxed">
              {mode === 'identity'
                ? 'Point your camera at your business license or ID QR code.'
                : 'Point your camera at the QR code on your table to start ordering.'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
