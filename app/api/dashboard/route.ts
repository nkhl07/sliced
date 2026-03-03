// app/api/dashboard/route.ts
// Dashboard data API — powers the operator view

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
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

  const finalized = orders.filter(o => o.status === 'finalized');
  const totalRevenue = finalized.reduce((s, o) => s + o.total, 0);

  return NextResponse.json({
    inventory: inventoryItems.map(item => ({
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
    })),
    decisions: recentDecisions,
    metrics: {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: finalized.length > 0 ? totalRevenue / finalized.length : 0,
      openOrders: orders.filter(o => o.status === 'open').length,
    },
    pricingEvents,
  });
}
