'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import QRCode from 'qrcode';

type TableStatus = 'open' | 'reserved' | 'ordering';

const STATUS_CONFIG: Record<TableStatus, { label: string; classes: string; dot: string }> = {
  open:      { label: 'Open',      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
  reserved:  { label: 'Reserved',  classes: 'bg-orange-50 text-orange-700 border-orange-200',     dot: 'bg-orange-400' },
  ordering:  { label: 'Ordering',  classes: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500' },
};

interface Props {
  tableCount: number;
  restaurantName: string;
  appUrl?: string;
}

export default function QRGenerator({ tableCount, restaurantName, appUrl }: Props) {
  const [baseUrl, setBaseUrl] = useState(appUrl || '');
  const [statuses, setStatuses] = useState<Record<number, TableStatus>>({});

  useEffect(() => {
    if (!baseUrl) setBaseUrl(window.location.origin);
  }, [baseUrl]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tableStatuses');
      if (saved) setStatuses(JSON.parse(saved));
    } catch {}
  }, []);

  const count = Math.max(1, Math.min(tableCount || 1, 100));

  function cycleStatus(tableNum: number) {
    const order: TableStatus[] = ['open', 'reserved', 'ordering'];
    const current = statuses[tableNum] ?? 'open';
    const next = order[(order.indexOf(current) + 1) % order.length];
    const updated = { ...statuses, [tableNum]: next };
    setStatuses(updated);
    try { localStorage.setItem('tableStatuses', JSON.stringify(updated)); } catch {}
  }

  async function downloadQR(tableNumber: number) {
    const url = `${baseUrl}/ordering?table=${tableNumber}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#1c1917', light: '#fdfcf8' },
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `table-${tableNumber}-qr.png`;
    a.click();
  }

  async function downloadAll() {
    for (let i = 1; i <= count; i++) {
      await downloadQR(i);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-stone-900">Table QR Codes</h2>
          <p className="text-stone-500 mt-1">
            Each QR code links guests directly to Sage at their table. Print and place on tables.
          </p>
        </div>
        {count > 1 && (
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
        )}
      </div>

      {!baseUrl ? (
        <div className="flex items-center justify-center py-20 text-stone-400 text-sm font-bold">
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: count }, (_, i) => i + 1).map(tableNum => (
            <TableQRCard
              key={tableNum}
              tableNumber={tableNum}
              restaurantName={restaurantName}
              url={`${baseUrl}/ordering?table=${tableNum}`}
              status={statuses[tableNum] ?? 'open'}
              onStatusClick={() => cycleStatus(tableNum)}
              onDownload={() => downloadQR(tableNum)}
            />
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
        <p className="font-bold mb-1">Setup tip</p>
        <p>
          QR codes link to <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">{baseUrl}/ordering?table=N</span>.{' '}
          For production, make sure <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">NEXT_PUBLIC_APP_URL</span> is set
          to your public domain.
        </p>
      </div>
    </div>
  );
}

function TableQRCard({
  tableNumber,
  restaurantName,
  url,
  status,
  onStatusClick,
  onDownload,
}: {
  tableNumber: number;
  restaurantName: string;
  url: string;
  status: TableStatus;
  onStatusClick: () => void;
  onDownload: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfg = STATUS_CONFIG[status];

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 1,
      color: { dark: '#1c1917', light: '#fdfcf8' },
    });
  }, [url]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group"
    >
      <div className="w-full flex items-center justify-between">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          {restaurantName}
        </span>
        <button
          onClick={onStatusClick}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all ${cfg.classes}`}
          title="Click to change status"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </button>
      </div>
      <canvas ref={canvasRef} className="rounded-lg" />
      <div className="text-center">
        <p className="font-black text-stone-900 text-lg leading-none">Table {tableNumber}</p>
        <p className="text-[10px] text-stone-400 font-medium mt-0.5">Scan to order</p>
      </div>
      <button
        onClick={onDownload}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all opacity-0 group-hover:opacity-100"
      >
        <Download className="w-3 h-3" />
        Download
      </button>
    </motion.div>
  );
}
