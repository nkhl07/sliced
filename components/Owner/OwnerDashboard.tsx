'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Star,
  Utensils,
} from 'lucide-react';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';

interface OwnerDashboardProps {
  menu: any[];
  orders: any[];
  tableCount?: number;
  onNavigate?: (tab: string) => void;
}

export default function OwnerDashboard({ menu, orders, tableCount, onNavigate }: OwnerDashboardProps) {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const [tableStatuses, setTableStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    function load() {
      try {
        const saved = localStorage.getItem('tableStatuses');
        if (saved) setTableStatuses(JSON.parse(saved));
      } catch {}
    }
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const activeTables = Object.values(tableStatuses).filter(s => s !== 'open').length;
  const dynamicPriceAlerts = menu.filter(item => Math.abs(item.dynamic_price - item.base_price) > 0.5);

  const bentoFeatures = [
    {
      name: 'Total Revenue',
      description: `$${totalRevenue.toFixed(2)} live across all active tables.`,
      href: '#',
      cta: 'View Details',
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <DollarSign className="w-40 h-40 text-emerald-600" />
        </div>
      ),
      Icon: DollarSign,
      className: 'lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3',
    },
    {
      name: 'Active Tables',
      description: `${activeTables} out of ${tableCount ?? '?'} currently active.`,
      href: '#',
      cta: 'View QR Codes',
      onClick: () => onNavigate?.('qr'),
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Users className="w-40 h-40 text-blue-600" />
        </div>
      ),
      Icon: Users,
      className: 'lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2',
    },
    {
      name: 'Guest Sentiment',
      description: 'Real-time AI interaction quality.',
      href: '#',
      cta: 'Read Reviews',
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Star className="w-40 h-40 text-amber-500" />
        </div>
      ),
      Icon: MessageSquare,
      className: 'lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3',
    },
    {
      name: 'Pricing Alerts',
      description: `${dynamicPriceAlerts.length} items currently with dynamic adjustments.`,
      href: '#',
      cta: 'Review Prices',
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <TrendingUp className="w-40 h-40 text-[#CC0000]" />
        </div>
      ),
      Icon: AlertCircle,
      className: 'lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-3',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-stone-900">Mission Control</h2>
          <p className="text-stone-500">Real-time operational intelligence.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live System Active
        </div>
      </div>

      {/* Bento Grid */}
      <BentoGrid className="lg:grid-rows-2">
        {bentoFeatures.map((feature, idx) => (
          <BentoCard
            key={idx}
            name={feature.name}
            description={feature.description}
            href={feature.href}
            cta={feature.cta}
            background={feature.background}
            Icon={feature.Icon}
            className={feature.className}
            onClick={(feature as any).onClick}
          />
        ))}
      </BentoGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Orders */}
        <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-bold text-stone-900">Live Orders</h3>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              {orders.length} Active
            </span>
          </div>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Utensils className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Waiting for first order...</p>
              </div>
            ) : (
              orders.map((order, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 apple-red rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {order.tableId || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-stone-800">
                        {order.items?.map((it: any) => it.name).join(', ') || 'Order'}
                      </p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Table {order.tableId || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-stone-900">${(order.total || 0).toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                      In Progress
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Sales Velocity */}
        <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-bold text-stone-900">Sales Velocity</h3>
            <TrendingUp className="w-5 h-5 text-[#CC0000]" />
          </div>
          <div className="space-y-3">
            {menu
              .sort((a, b) => b.current_sold_quantity - a.current_sold_quantity)
              .slice(0, 5)
              .map((item, i) => {
                const diff = item.dynamic_price - item.base_price;
                const progress = (item.current_sold_quantity / item.target_daily_quantity) * 100;
                return (
                  <div key={i} className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-bold text-sm text-stone-800">{item.name}</p>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            {item.current_sold_quantity} sold today
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-stone-900">${item.dynamic_price.toFixed(2)}</p>
                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-widest ${
                            diff >= 0 ? 'text-emerald-600' : 'text-[#CC0000]'
                          }`}
                        >
                          {diff >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs((diff / item.base_price) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        className={`h-full ${progress > 80 ? 'bg-[#CC0000]' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
