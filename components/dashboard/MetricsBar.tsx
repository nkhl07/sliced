'use client';

interface Props {
  metrics: unknown;
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

export default function MetricsBar({ pricingEvents }: Props) {
  return (
    <div className="space-y-6">
      {/* Recent Pricing Events */}
      {pricingEvents.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Recent Price Adjustments
          </h3>
          <div className="space-y-2">
            {pricingEvents.slice(0, 5).map(event => {
              const isDiscount = event.priceDelta < 0;
              return (
                <div key={event.id} className="bg-white rounded-2xl border border-stone-100 p-3 flex items-center gap-3">
                  <span className="text-lg">{event.menuItem.imageEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-800 text-sm font-medium">{event.menuItem.name}</span>
                      <span className={`text-xs font-medium ${isDiscount ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isDiscount ? '▼' : '▲'}
                        ${Math.abs(event.priceDelta).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-stone-400 text-xs truncate">{event.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-stone-300 text-xs line-through">${event.basePrice.toFixed(2)}</p>
                    <p className={`text-sm font-medium ${isDiscount ? 'text-emerald-600' : 'text-stone-800'}`}>
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
