// lib/pricing/dynamic.ts
// Dynamic pricing engine — the core revenue intelligence of sliced.ai
//
// Factors:
//   1. Inventory   — overstocked perishables get discounted; low stock gets a premium
//   2. Demand      — hot items tonight command a higher price
//   3. Time        — as shift close approaches, perishable discounts deepen
//
// All price changes are bounded (max ±20%) and round to nearest $0.25

import { prisma } from '@/lib/db';

export interface PricingResult {
  basePrice: number;
  dynamicPrice: number;
  priceDelta: number;        // absolute $ change
  percentChange: number;     // % change from base
  reason: string;
  isPromoted: boolean;       // should AI proactively suggest this item?
  inventoryFactor: number;
  demandFactor: number;
  timeFactor: number;
}

interface ItemForPricing {
  id: number;
  basePrice: number;
  isPerishable: boolean;
  inventory?: { currentStock: number; maxStock: number } | null;
}

export async function calculateDynamicPrice(item: ItemForPricing): Promise<PricingResult> {
  const base = item.basePrice;
  let multiplier = 1.0;
  const reasons: string[] = [];

  let inventoryFactor = 0;
  let demandFactor = 0;
  let timeFactor = 0;

  // ── 1. INVENTORY FACTOR ──────────────────────────────────────────────────
  if (item.inventory) {
    const { currentStock, maxStock } = item.inventory;
    const stockRatio = maxStock > 0 ? currentStock / maxStock : 0;

    if (currentStock === 0) {
      // Out of stock — price irrelevant but return base
      return {
        basePrice: base,
        dynamicPrice: base,
        priceDelta: 0,
        percentChange: 0,
        reason: 'Out of stock',
        isPromoted: false,
        inventoryFactor: 0,
        demandFactor: 0,
        timeFactor: 0,
      };
    }

    if (stockRatio > 0.80 && item.isPerishable) {
      // Overstocked perishable: discount up to 20%
      const excess = Math.min(stockRatio - 0.80, 0.40); // cap at 40% over
      inventoryFactor = -(excess * 0.50); // up to -20%
      reasons.push(`Overstocked (${currentStock}/${maxStock} units, ${Math.round(stockRatio * 100)}% of max) — discounted to move inventory`);
    } else if (stockRatio < 0.20 && stockRatio > 0) {
      // Low stock: premium up to 12%
      inventoryFactor = (0.20 - stockRatio) * 0.60; // up to +12%
      reasons.push(`Limited availability (${currentStock} remaining) — scarcity premium`);
    }
    multiplier += inventoryFactor;
  }

  // ── 2. DEMAND FACTOR ────────────────────────────────────────────────────
  // Count how many times this item was ordered today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const demandCount = await prisma.orderItem.count({
    where: {
      menuItemId: item.id,
      order: { createdAt: { gte: todayStart } },
    },
  });

  if (demandCount > 8) {
    // Popular item tonight: premium up to 10%
    const excess = Math.min(demandCount - 8, 20);
    demandFactor = excess * 0.005; // +0.5% per order above 8, max 10%
    reasons.push(`High demand tonight (${demandCount} orders) — popularity premium`);
    multiplier += demandFactor;
  }

  // ── 3. TIME FACTOR ──────────────────────────────────────────────────────
  const shift = await prisma.shiftConfig.findFirst({ where: { isActive: true } });
  if (shift && item.isPerishable) {
    const now = Date.now();
    const shiftEndTime = new Date(shift.shiftEnd).getTime();
    const shiftStartTime = new Date(shift.shiftStart).getTime();
    const totalShiftMs = shiftEndTime - shiftStartTime;
    const remainingMs = Math.max(shiftEndTime - now, 0);
    const fractionRemaining = remainingMs / totalShiftMs;

    if (fractionRemaining < 0.25) {
      // Less than 25% of shift left — deepen discount on perishables
      timeFactor = -(0.25 - fractionRemaining) * 0.40; // up to -10%
      reasons.push(`${Math.round(fractionRemaining * 100)}% of shift remaining — end-of-night discount`);
      multiplier += timeFactor;
    }
  }

  // ── BOUNDS + ROUNDING ───────────────────────────────────────────────────
  multiplier = Math.max(0.80, Math.min(1.20, multiplier)); // ±20% max
  const rawPrice = base * multiplier;
  const dynamicPrice = Math.round(rawPrice * 4) / 4; // round to $0.25

  const priceDelta = dynamicPrice - base;
  const percentChange = ((dynamicPrice - base) / base) * 100;

  // ── LOG SIGNIFICANT EVENTS ───────────────────────────────────────────────
  if (Math.abs(priceDelta) >= 0.50) {
    // Log pricing event asynchronously (don't await to keep response fast)
    prisma.pricingEvent.create({
      data: {
        menuItemId: item.id,
        basePrice: base,
        dynamicPrice,
        priceDelta,
        reason: reasons.join('; ') || 'No adjustment',
        inventoryFactor,
        demandFactor,
        timeFactor,
      },
    }).catch(() => {}); // silent fail — non-critical
  }

  const isPromoted = priceDelta < -0.50; // actively discount → AI should mention it

  return {
    basePrice: base,
    dynamicPrice,
    priceDelta,
    percentChange,
    reason: reasons.length > 0 ? reasons.join('; ') : 'Standard pricing',
    isPromoted,
    inventoryFactor,
    demandFactor,
    timeFactor,
  };
}

export function formatPriceChange(result: PricingResult): string {
  if (Math.abs(result.percentChange) < 1) return '';
  const sign = result.priceDelta > 0 ? '+' : '';
  return `${sign}${result.percentChange.toFixed(0)}%`;
}
