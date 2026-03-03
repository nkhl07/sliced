import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import InventoryGrid from '@/components/dashboard/InventoryGrid';
import AIDecisionsLog from '@/components/dashboard/AIDecisionsLog';
import MetricsBar from '@/components/dashboard/MetricsBar';
import { RefreshCw, ExternalLink, ChefHat } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Operator Dashboard · sliced.ai',
  description: 'Real-time visibility into AI decisions, inventory, and revenue performance.',
};

export const revalidate = 10; // Revalidate every 10 seconds

async function getDashboardData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [inventoryItems, recentDecisions, orders, pricingEvents] = await Promise.all([
    prisma.menuItem.findMany({
      include: { inventory: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.aIDecision.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
      include: {
        menuItem: { select: { name: true, imageEmoji: true } },
        order: { select: { sessionId: true } },
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      include: { items: true },
    }),
    prisma.pricingEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { menuItem: { select: { name: true, imageEmoji: true } } },
    }),
  ]);

  const totalRevenue = orders
    .filter(o => o.status === 'finalized')
    .reduce((s, o) => s + o.total, 0);

  const finalized = orders.filter(o => o.status === 'finalized');
  const avgOrderValue = finalized.length > 0 ? totalRevenue / finalized.length : 0;

  const inventoryFormatted = inventoryItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    imageEmoji: item.imageEmoji,
    currentStock: item.inventory?.currentStock ?? 0,
    maxStock: item.inventory?.maxStock ?? 0,
    stockPercent: item.inventory?.maxStock
      ? (item.inventory.currentStock / item.inventory.maxStock) * 100
      : 0,
    isAvailable: item.isAvailable,
  }));

  return {
    inventory: inventoryFormatted,
    decisions: recentDecisions,
    metrics: {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue,
      openOrders: orders.filter(o => o.status === 'open').length,
    },
    pricingEvents,
    alerts: {
      outOfStock: inventoryFormatted.filter(i => i.currentStock === 0).length,
      lowStock: inventoryFormatted.filter(i => i.currentStock > 0 && i.stockPercent < 20).length,
      overstocked: inventoryFormatted.filter(i => i.stockPercent > 80 && i.maxStock > 0).length,
    },
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <span className="text-xl">🍽️</span>
            <span className="font-medium text-sm">sliced.ai</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-text-primary font-semibold">Operator Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Alert badges */}
          {data.alerts.outOfStock > 0 && (
            <span className="badge bg-crimson/15 text-crimson border-crimson/30">
              {data.alerts.outOfStock} out of stock
            </span>
          )}
          {data.alerts.lowStock > 0 && (
            <span className="badge bg-amber/15 text-amber border-amber/30">
              {data.alerts.lowStock} low stock
            </span>
          )}
          {data.alerts.overstocked > 0 && (
            <span className="badge bg-blue-400/15 text-blue-400 border-blue-400/30">
              {data.alerts.overstocked} overstocked
            </span>
          )}
          <Link
            href="/ordering"
            target="_blank"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <ExternalLink size={14} />
            Guest View
          </Link>
        </div>
      </header>

      <div className="px-8 py-8 max-w-7xl mx-auto space-y-12">

        {/* Revenue & Metrics */}
        <section>
          <SectionHeader
            title="Tonight's Performance"
            subtitle="Live metrics for the current shift"
          />
          <MetricsBar metrics={data.metrics} pricingEvents={data.pricingEvents} />
        </section>

        {/* AI Decision Log */}
        <section>
          <SectionHeader
            title="AI Decision Log"
            subtitle="Every recommendation, promotion, and pivot — with the reasoning behind it"
            badge={`${data.decisions.length} decisions`}
          />
          <AIDecisionsLog decisions={data.decisions} />
        </section>

        {/* Inventory */}
        <section>
          <SectionHeader
            title="Live Inventory"
            subtitle="Stock levels driving AI upsell and pricing behavior"
          />
          <InventoryGrid items={data.inventory} />
        </section>

      </div>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/5 text-center text-text-secondary text-xs mt-8">
        <p className="flex items-center justify-center gap-2">
          <ChefHat size={12} />
          The Olive Branch · Powered by sliced.ai · Page refreshes every 10s
          <RefreshCw size={10} className="animate-spin opacity-30" />
        </p>
      </footer>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="text-text-secondary text-sm mt-0.5">{subtitle}</p>
      </div>
      {badge && (
        <span className="badge bg-surface-2 text-text-secondary border-white/10">{badge}</span>
      )}
    </div>
  );
}
