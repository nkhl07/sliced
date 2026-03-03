// lib/ai/tool-handlers.ts
// Pure async functions that execute each tool's business logic.
// Shared between the Vercel AI SDK text chat (/api/chat) and the Vapi voice webhook (/api/vapi/tools).

import { prisma } from '@/lib/db';
import { calculateDynamicPrice } from '@/lib/pricing/dynamic';

// ── SEARCH MENU ─────────────────────────────────────────────────────────────

export interface SearchMenuParams {
  query?: string;
  category?: string;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isHalal?: boolean;
  isKosher?: boolean;
  isGlutenFree?: boolean;
  excludeAllergen?: string;
  sortByMargin?: boolean;
}

export async function handleSearchMenu(params: SearchMenuParams) {
  const items = await prisma.menuItem.findMany({
    where: {
      isAvailable: true,
      ...(params.category && { category: params.category }),
      ...(params.isVegan && { isVegan: true }),
      ...(params.isVegetarian && { isVegetarian: true }),
      ...(params.isHalal && { isHalal: true }),
      ...(params.isKosher && { isKosher: true }),
      ...(params.isGlutenFree && { isGlutenFree: true }),
    },
    include: { inventory: true },
    orderBy: params.sortByMargin ? { marginPercent: 'desc' } : { category: 'asc' },
  });

  const filtered = params.query
    ? items.filter(i =>
        i.name.toLowerCase().includes(params.query!.toLowerCase()) ||
        i.description.toLowerCase().includes(params.query!.toLowerCase())
      )
    : items;

  const allergenFiltered = params.excludeAllergen
    ? filtered.filter(i => !i.allergens.toLowerCase().includes(params.excludeAllergen!.toLowerCase()))
    : filtered;

  const results = await Promise.all(
    allergenFiltered.map(async (item) => {
      const pricing = await calculateDynamicPrice(item);
      const stock = item.inventory?.currentStock ?? 0;
      const maxStock = item.inventory?.maxStock ?? 0;

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        currentPrice: pricing.dynamicPrice,
        priceNote: pricing.percentChange !== 0 ? pricing.reason : null,
        dietary: {
          isVegan: item.isVegan,
          isVegetarian: item.isVegetarian,
          isHalal: item.isHalal,
          isKosher: item.isKosher,
          isGlutenFree: item.isGlutenFree,
        },
        allergens: item.allergens || 'none',
        imageEmoji: item.imageEmoji,
        availability: stock === 0 ? 'out_of_stock' : stock < 5 ? 'limited' : 'available',
        stockCount: stock,
        isPromoted: pricing.isPromoted,
        marginPercent: item.marginPercent,
      };
    })
  );

  return { items: results, count: results.length };
}

// ── CHECK INVENTORY ──────────────────────────────────────────────────────────

export async function handleCheckInventory({ menuItemId }: { menuItemId: number }) {
  const inventory = await prisma.inventory.findUnique({
    where: { menuItemId },
    include: { menuItem: true },
  });

  if (!inventory) return { available: false, reason: 'Item not found in inventory' };

  const stockRatio = inventory.maxStock > 0 ? inventory.currentStock / inventory.maxStock : 0;

  return {
    menuItemId,
    name: inventory.menuItem.name,
    currentStock: inventory.currentStock,
    maxStock: inventory.maxStock,
    available: inventory.currentStock > 0,
    status: inventory.currentStock === 0
      ? 'out_of_stock'
      : inventory.currentStock < 5
      ? 'limited'
      : stockRatio > 0.8
      ? 'overstocked'
      : 'normal',
  };
}

// ── GET DYNAMIC PRICE ────────────────────────────────────────────────────────

export async function handleGetDynamicPrice({ menuItemId }: { menuItemId: number }) {
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { inventory: true },
  });

  if (!item) return { error: 'Item not found' };

  const pricing = await calculateDynamicPrice(item);

  return {
    menuItemId,
    name: item.name,
    basePrice: pricing.basePrice,
    currentPrice: pricing.dynamicPrice,
    percentChange: Math.round(pricing.percentChange),
    reason: pricing.reason,
    isDiscounted: pricing.priceDelta < -0.25,
    isPremium: pricing.priceDelta > 0.25,
  };
}

// ── ADD TO ORDER ─────────────────────────────────────────────────────────────

export interface AddToOrderParams {
  menuItemId: number;
  quantity: number;
  specialInstructions?: string;
  sessionId: string;
}

export async function handleAddToOrder({ menuItemId, quantity, specialInstructions, sessionId }: AddToOrderParams) {
  let order = await prisma.order.findUnique({ where: { sessionId } });
  if (!order) {
    order = await prisma.order.create({ data: { sessionId, status: 'open' } });
  }

  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { inventory: true },
  });

  if (!item) return { success: false, error: 'Item not found' };
  if ((item.inventory?.currentStock ?? 0) < quantity) {
    return { success: false, error: `Only ${item.inventory?.currentStock ?? 0} of ${item.name} remaining` };
  }

  const pricing = await calculateDynamicPrice(item);

  const existing = await prisma.orderItem.findFirst({ where: { orderId: order.id, menuItemId } });

  if (existing) {
    await prisma.orderItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.orderItem.create({
      data: { orderId: order.id, menuItemId, quantity, priceAtOrder: pricing.dynamicPrice, modifiers: specialInstructions },
    });
  }

  await prisma.inventory.update({ where: { menuItemId }, data: { currentStock: { decrement: quantity } } });

  const allItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  const subtotal = allItems.reduce((s, i) => s + i.priceAtOrder * i.quantity, 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  await prisma.order.update({ where: { id: order.id }, data: { subtotal, tax, total } });

  if (pricing.isPromoted) {
    await prisma.aIDecision.create({
      data: {
        orderId: order.id,
        menuItemId,
        decisionType: 'promoted',
        reason: pricing.reason,
        metadata: JSON.stringify({ basePrice: pricing.basePrice, dynamicPrice: pricing.dynamicPrice, percentChange: pricing.percentChange }),
      },
    }).catch(() => {});
  }

  return {
    success: true,
    item: item.name,
    emoji: item.imageEmoji,
    quantity,
    priceEach: pricing.dynamicPrice,
    lineTotal: pricing.dynamicPrice * quantity,
    orderTotal: total,
    specialInstructions: specialInstructions || null,
  };
}

// ── GET ORDER SUMMARY ────────────────────────────────────────────────────────

export async function handleGetOrderSummary({ sessionId }: { sessionId: string }) {
  const order = await prisma.order.findUnique({
    where: { sessionId },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order || order.items.length === 0) return { hasItems: false, message: 'No items ordered yet' };

  return {
    hasItems: true,
    status: order.status,
    items: order.items.map(i => ({
      name: i.menuItem.name,
      emoji: i.menuItem.imageEmoji,
      quantity: i.quantity,
      priceEach: i.priceAtOrder,
      lineTotal: i.priceAtOrder * i.quantity,
      modifiers: i.modifiers,
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
  };
}

// ── GET RECOMMENDATIONS ───────────────────────────────────────────────────────

export interface GetRecommendationsParams {
  sessionId: string;
  context?: string;
  focusCategory?: string;
}

export async function handleGetRecommendations({ sessionId, context, focusCategory }: GetRecommendationsParams) {
  const order = await prisma.order.findUnique({
    where: { sessionId },
    include: { items: { include: { menuItem: true } } },
  });

  const orderedCategories = new Set(order?.items.map(i => i.menuItem.category) ?? []);
  const orderedItemIds = new Set(order?.items.map(i => i.menuItemId) ?? []);
  const orderedItems = order?.items.map(i => i.menuItem) ?? [];
  const isHalalOrder = orderedItems.some(i => i.isHalal);
  const isVeganOrder = orderedItems.length > 0 && orderedItems.every(i => i.isVegan);

  const candidates = await prisma.menuItem.findMany({
    where: {
      isAvailable: true,
      ...(focusCategory ? { category: focusCategory } : {}),
      ...(isVeganOrder ? { isVegan: true } : {}),
      ...(isHalalOrder ? { isHalal: true } : {}),
    },
    include: { inventory: true },
  });

  const scored = await Promise.all(
    candidates
      .filter(item => !orderedItemIds.has(item.id) && (item.inventory?.currentStock ?? 0) > 0)
      .map(async (item) => {
        let score = 0;
        const pricing = await calculateDynamicPrice(item);
        score += item.marginPercent * 25;
        if (pricing.isPromoted) score += 20;
        if (!orderedCategories.has('drink') && item.category === 'drink') score += 30;
        if (!orderedCategories.has('dessert') && item.category === 'dessert') score += 15;
        if (!orderedCategories.has('side') && item.category === 'side') score += 20;
        if (!orderedCategories.has('starter') && item.category === 'starter' && orderedCategories.size === 0) score += 25;
        return { item, score, pricing };
      })
  );

  const top3 = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item, pricing }) => ({
      id: item.id,
      name: item.name,
      emoji: item.imageEmoji,
      category: item.category,
      description: item.description,
      price: pricing.dynamicPrice,
      isPromoted: pricing.isPromoted,
    }));

  if (top3.length > 0 && order) {
    prisma.aIDecision.create({
      data: {
        orderId: order.id,
        decisionType: 'basket_analysis',
        reason: `Basket analysis suggested: ${top3.map(i => i.name).join(', ')}`,
        metadata: JSON.stringify({ suggestions: top3.map(i => i.name) }),
      },
    }).catch(() => {});
  }

  return { recommendations: top3 };
}

// ── FINALIZE ORDER ────────────────────────────────────────────────────────────

export interface FinalizeOrderParams {
  sessionId: string;
  tableNumber?: number;
  notes?: string;
}

export async function handleFinalizeOrder({ sessionId, tableNumber, notes }: FinalizeOrderParams) {
  const order = await prisma.order.findUnique({
    where: { sessionId },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order || order.items.length === 0) return { success: false, error: 'No items in order to finalize' };

  await prisma.order.update({ where: { id: order.id }, data: { status: 'finalized', tableNum: tableNumber, notes } });

  return {
    success: true,
    orderNumber: order.id,
    itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
    total: order.total,
    estimatedWait: Math.floor(Math.random() * 10) + 15,
    items: order.items.map(i => ({ name: i.menuItem.name, emoji: i.menuItem.imageEmoji, quantity: i.quantity })),
  };
}
