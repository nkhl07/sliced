'use client';

import { AlertTriangle, TrendingUp, TrendingDown, Package } from 'lucide-react';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  stockPercent: number;
  isAvailable: boolean;
  imageEmoji?: string;
}

interface Props {
  items: InventoryItem[];
}

export default function InventoryGrid({ items }: Props) {
  const categories = ['starter', 'main', 'side', 'dessert', 'drink'];

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const catLabels: Record<string, string> = {
    starter: 'Starters',
    main: 'Mains',
    side: 'Sides',
    dessert: 'Desserts',
    drink: 'Drinks',
  };

  return (
    <div className="space-y-8">
      {categories.map(cat => {
        const catItems = grouped[cat];
        if (!catItems?.length) return null;

        return (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              {catLabels[cat]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catItems.map(item => (
                <InventoryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InventoryCard({ item }: { item: InventoryItem }) {
  const stockRatio = item.maxStock > 0 ? item.currentStock / item.maxStock : 0;
  const isOut = item.currentStock === 0;
  const isLow = !isOut && stockRatio < 0.2;
  const isOver = stockRatio > 0.8 && item.maxStock > 0;
  const isNormal = !isOut && !isLow && !isOver;

  const statusColor = isOut
    ? 'bg-crimson/60'
    : isLow
    ? 'bg-amber/60'
    : isOver
    ? 'bg-blue-400/60'
    : 'bg-jade/60';

  const barColor = isOut
    ? 'bg-crimson'
    : isLow
    ? 'bg-amber'
    : isOver
    ? 'bg-blue-400'
    : 'bg-jade';

  const barWidth = isOver
    ? 100
    : Math.min(stockRatio * 100, 100);

  return (
    <div className={`card p-4 transition-all ${isOut ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{item.imageEmoji || '🍽️'}</span>
          <div className="min-w-0">
            <p className="text-text-primary text-sm font-medium truncate">{item.name}</p>
          </div>
        </div>
        <StatusBadge isOut={isOut} isLow={isLow} isOver={isOver} />
      </div>

      {/* Stock bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>{item.currentStock} units</span>
          <span>max {item.maxStock}</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Status text */}
      {isOut && (
        <p className="text-xs text-crimson flex items-center gap-1 mt-2">
          <AlertTriangle size={11} /> Out of stock — AI will pivot guests
        </p>
      )}
      {isLow && (
        <p className="text-xs text-amber flex items-center gap-1 mt-2">
          <TrendingDown size={11} /> Low stock — scarcity pricing active
        </p>
      )}
      {isOver && (
        <p className="text-xs text-blue-400 flex items-center gap-1 mt-2">
          <TrendingUp size={11} /> Overstocked — AI will promote & discount
        </p>
      )}
    </div>
  );
}

function StatusBadge({ isOut, isLow, isOver }: { isOut: boolean; isLow: boolean; isOver: boolean }) {
  if (isOut) return <span className="badge bg-crimson/15 text-crimson border-crimson/30">Out</span>;
  if (isLow) return <span className="badge bg-amber/15 text-amber border-amber/30">Low</span>;
  if (isOver) return <span className="badge bg-blue-400/15 text-blue-400 border-blue-400/30">Promo</span>;
  return <span className="badge bg-jade/15 text-jade border-jade/30">OK</span>;
}
