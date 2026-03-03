'use client';

import { DollarSign, ShoppingBag, TrendingUp, Clock } from 'lucide-react';

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  openOrders: number;
}

interface Props {
  metrics: Metrics;
  pricingEvents: Array<{
    id: number;
    menuItem: { name: string; imageEmoji: string };
    basePrice: number;
    dynamicPrice: number;
    priceDelta: number;
    reason: string;
    createdAt: string;
  }>;
}

export default function MetricsBar({ metrics, pricingEvents }: Props) {
  const revenueGain = pricingEvents
    .filter(e => e.priceDelta > 0)
    .reduce((s, e) => s + e.priceDelta, 0);

  const revenueSaved = pricingEvents
    .filter(e => e.priceDelta < 0)
    .length; // items discounted to move inventory

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}
          label="Tonight's Revenue"
          value={`$${metrics.totalRevenue.toFixed(0)}`}
          sub="all finalized orders"
          color="text-jade"
        />
        <KPICard
          icon={ShoppingBag}
          label="Total Orders"
          value={`${metrics.totalOrders}`}
          sub={`${metrics.openOrders} still open`}
          color="text-gold"
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Order Value"
          value={`$${metrics.avgOrderValue.toFixed(2)}`}
          sub="per session"
          color="text-blue-400"
        />
        <KPICard
          icon={Clock}
          label="Dynamic Adjustments"
          value={`${pricingEvents.length}`}
          sub={`${revenueSaved} items discounted to clear`}
          color="text-amber"
        />
      </div>

      {/* Recent Pricing Events */}
      {pricingEvents.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Recent Price Adjustments
          </h3>
          <div className="space-y-2">
            {pricingEvents.slice(0, 5).map(event => {
              const isDiscount = event.priceDelta < 0;
              return (
                <div key={event.id} className="card p-3 flex items-center gap-3">
                  <span className="text-lg">{event.menuItem.imageEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary text-sm font-medium">{event.menuItem.name}</span>
                      <span className={`text-xs font-medium ${isDiscount ? 'text-jade' : 'text-crimson'}`}>
                        {isDiscount ? '▼' : '▲'}
                        ${Math.abs(event.priceDelta).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs truncate">{event.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-text-secondary/50 text-xs line-through">${event.basePrice.toFixed(2)}</p>
                    <p className={`text-sm font-medium ${isDiscount ? 'text-jade' : 'text-text-primary'}`}>
                      ${event.dynamicPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className={`w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center mb-3 ${color}`}>
        <Icon size={16} className="opacity-80" />
      </div>
      <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
      <p className="text-text-primary text-sm font-medium">{label}</p>
      <p className="text-text-secondary text-xs mt-0.5">{sub}</p>
    </div>
  );
}
