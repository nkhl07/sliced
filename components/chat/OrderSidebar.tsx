'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

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
  version: number; // increment to trigger refresh
}

export default function OrderSidebar({ sessionId, version }: Props) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/orders?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch {
      // Silently fail — order sidebar is non-critical
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Fetch on version change (after AI responds)
  useEffect(() => {
    setLoading(true);
    fetchOrder();
  }, [version, fetchOrder]);

  // Poll every 8 seconds as fallback
  useEffect(() => {
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const isEmpty = !order || !order.hasItems;
  const isFinalized = order?.status === 'finalized';

  return (
    <aside className="w-80 flex-shrink-0 border-l border-white/5 bg-surface/50 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-gold" />
          <span className="font-semibold text-text-primary text-sm">Your Order</span>
          {order?.itemCount ? (
            <span className="w-5 h-5 rounded-full bg-gold text-background text-xs font-bold flex items-center justify-center">
              {order.itemCount}
            </span>
          ) : null}
        </div>
        {loading && <Loader2 size={14} className="text-text-secondary animate-spin" />}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-2xl">
              🌿
            </div>
            <p className="text-text-secondary text-sm">Your order is empty.</p>
            <p className="text-text-secondary/60 text-xs">
              Chat with Sage to browse the menu and add items.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="card-2 p-3 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{item.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-text-primary text-sm font-medium leading-tight truncate">
                        {item.name}
                      </p>
                      {item.modifiers && (
                        <p className="text-text-secondary/70 text-xs mt-0.5 leading-tight">
                          {item.modifiers}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-text-primary text-sm font-medium">${item.lineTotal.toFixed(2)}</p>
                    <p className="text-text-secondary text-xs">×{item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals + Status */}
      {!isEmpty && (
        <div className="px-5 py-4 border-t border-white/5 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-text-primary">${order!.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Tax (8.75%)</span>
              <span className="text-text-primary">${order!.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1 border-t border-white/5">
              <span className="text-text-primary">Total</span>
              <span className="text-gold text-base">${order!.total.toFixed(2)}</span>
            </div>
          </div>

          {isFinalized ? (
            <div className="bg-jade/10 border border-jade/20 rounded-lg px-4 py-3 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-jade flex-shrink-0" />
              <div>
                <p className="text-jade text-sm font-medium">Order Confirmed!</p>
                <p className="text-jade/70 text-xs mt-0.5">Sent to the kitchen. 15–25 min.</p>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary/50 text-xs text-center">
              Tell Sage when you're ready to finalize
            </p>
          )}
        </div>
      )}

      {/* Session ID for operator reference */}
      <div className="px-5 py-3 border-t border-white/5">
        <p className="text-text-secondary/30 text-xs font-mono truncate">
          session: {sessionId.slice(0, 8)}...
        </p>
      </div>
    </aside>
  );
}
