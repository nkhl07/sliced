'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  name: string;
  emoji: string;
  quantity: number;
  priceEach: number;
  lineTotal: number;
  modifiers?: string | null;
}

interface OrderData {
  hasItems: boolean;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

interface Props {
  sessionId: string;
  version: number;
}

export default function OrderSidebar({ sessionId, version }: Props) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/orders?sessionId=${sessionId}`);
      if (res.ok) setOrder(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { setLoading(true); fetchOrder(); }, [version, fetchOrder]);
  useEffect(() => {
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const isEmpty = !order || !order.hasItems;
  const isFinalized = order?.status === 'finalized';

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="w-80 flex-shrink-0 border-l border-stone-100 bg-white flex flex-col shadow-sm"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-stone-400" />
          <span className="font-serif font-black text-stone-900 text-lg leading-none">Your Order</span>
          <AnimatePresence>
            {order?.itemCount ? (
              <motion.span
                key={order.itemCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-5 h-5 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center"
              >
                {order.itemCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        {loading && <Loader2 size={14} className="text-stone-300 animate-spin" />}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center gap-3 py-12"
            >
              <div className="w-14 h-14 rounded-[18px] bg-stone-50 border border-stone-100 flex items-center justify-center text-2xl shadow-sm">
                🌿
              </div>
              <p className="text-stone-500 text-sm font-medium">Your order is empty.</p>
              <p className="text-stone-400 text-xs">
                Chat with Sage to browse the menu and add items.
              </p>
            </motion.div>
          ) : (
            <motion.div key="items" className="space-y-2">
              {order.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{item.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-stone-900 text-sm font-bold leading-tight truncate">{item.name}</p>
                      {item.modifiers && (
                        <p className="text-stone-400 text-xs mt-0.5 leading-tight">{item.modifiers}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-stone-900 text-sm font-bold">${item.lineTotal.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">×{item.quantity}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <AnimatePresence>
        {!isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-6 py-5 border-t border-stone-100 space-y-3"
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-stone-900 font-medium">${order!.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Tax (8.75%)</span>
                <span className="text-stone-900 font-medium">${order!.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-stone-200">
                <span className="text-stone-900">Total</span>
                <span className="text-stone-900 text-base">${order!.total.toFixed(2)}</span>
              </div>
            </div>

            {isFinalized ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-emerald-700 text-sm font-bold">Order Confirmed!</p>
                  <p className="text-emerald-600 text-xs mt-0.5">Sent to the kitchen. 15–25 min.</p>
                </div>
              </motion.div>
            ) : (
              <p className="text-stone-400 text-xs text-center">
                Tell Sage when you're ready to finalize
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session ref */}
      <div className="px-6 py-3 border-t border-stone-100">
        <p className="text-stone-300 text-xs font-mono truncate" suppressHydrationWarning>session: {sessionId.slice(0, 8)}…</p>
      </div>
    </motion.aside>
  );
}
