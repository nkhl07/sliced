'use client';

import { Brain, TrendingDown, TrendingUp, AlertTriangle, ShoppingCart, Info } from 'lucide-react';

interface AIDecision {
  id: number;
  decisionType: string;
  reason: string;
  metadata?: string | null;
  createdAt: string;
  menuItem?: { name: string; imageEmoji: string } | null;
  order?: { sessionId: string } | null;
}

interface Props {
  decisions: AIDecision[];
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  promoted: { label: 'Promoted', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: TrendingDown },
  dynamic_price: { label: 'Price Change', color: 'text-amber bg-amber/10 border-amber/20', icon: TrendingUp },
  out_of_stock_pivot: { label: 'Stock Pivot', color: 'text-crimson bg-crimson/10 border-crimson/20', icon: AlertTriangle },
  upsell: { label: 'Upsell', color: 'text-jade bg-jade/10 border-jade/20', icon: TrendingUp },
  basket_analysis: { label: 'Basket Analysis', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: ShoppingCart },
  allergen_flag: { label: 'Allergen Flag', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: AlertTriangle },
};

export default function AIDecisionsLog({ decisions }: Props) {
  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
          <Brain size={20} className="text-text-secondary" />
        </div>
        <p className="text-text-secondary text-sm">No AI decisions logged yet.</p>
        <p className="text-text-secondary/60 text-xs">Decisions are logged when guests order through Sage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {decisions.map(decision => {
        const config = typeConfig[decision.decisionType] ?? {
          label: decision.decisionType,
          color: 'text-text-secondary bg-surface-2 border-white/10',
          icon: Info,
        };
        const Icon = config.icon;

        let metadata: Record<string, unknown> | null = null;
        try {
          if (decision.metadata) metadata = JSON.parse(decision.metadata);
        } catch {}

        const timeStr = new Date(decision.createdAt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return (
          <div key={decision.id} className="card p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${config.color}`}>
                <Icon size={14} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`badge border ${config.color} text-xs`}>{config.label}</span>
                  {decision.menuItem && (
                    <span className="text-text-primary text-sm font-medium">
                      {decision.menuItem.imageEmoji} {decision.menuItem.name}
                    </span>
                  )}
                  <span className="text-text-secondary/50 text-xs ml-auto">{timeStr}</span>
                </div>

                <p className="text-text-secondary text-sm leading-relaxed">{decision.reason}</p>

                {/* Pricing metadata */}
                {metadata && typeof metadata === 'object' && 'basePrice' in metadata && (
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="text-text-secondary/60 line-through">${(metadata.basePrice as number).toFixed(2)}</span>
                    <span className="text-jade font-medium">${(metadata.dynamicPrice as number).toFixed(2)}</span>
                    <span className={`font-medium ${Number(metadata.priceDelta ?? (Number(metadata.dynamicPrice) - Number(metadata.basePrice))) < 0 ? 'text-jade' : 'text-crimson'}`}>
                      {Number(metadata.priceDelta ?? (Number(metadata.dynamicPrice) - Number(metadata.basePrice))) < 0 ? '▼' : '▲'}
                      {Math.abs(Number(metadata.percentChange ?? ((Number(metadata.dynamicPrice) - Number(metadata.basePrice)) / Number(metadata.basePrice) * 100))).toFixed(0)}%
                    </span>
                  </div>
                )}

                {/* Session reference */}
                {decision.order && (
                  <p className="text-text-secondary/30 text-xs mt-1 font-mono">
                    session: {decision.order.sessionId.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
