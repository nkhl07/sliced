// app/api/orders/route.ts
// Returns the current order state for a given session (used by OrderSidebar)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: { menuItem: { select: { name: true, imageEmoji: true, category: true } } },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!order || order.items.length === 0) {
    return NextResponse.json({ hasItems: false });
  }

  return NextResponse.json({
    hasItems: true,
    status: order.status,
    items: order.items.map(i => ({
      name: i.menuItem.name,
      emoji: i.menuItem.imageEmoji,
      category: i.menuItem.category,
      quantity: i.quantity,
      priceEach: i.priceAtOrder,
      lineTotal: i.priceAtOrder * i.quantity,
      modifiers: i.modifiers,
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
  });
}
