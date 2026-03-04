// app/api/menu/items/route.ts
// Bulk create menu items in Prisma DB (used after OCR review confirmation)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const ItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(['starter', 'main', 'side', 'dessert', 'drink']),
  basePrice: z.number(),
  isVegan: z.boolean().default(false),
  isVegetarian: z.boolean().default(false),
  isHalal: z.boolean().default(false),
  isKosher: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  allergens: z.string().default(''),
  imageEmoji: z.string().default('🍽️'),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = BodySchema.parse(body);

    const created = await prisma.$transaction(
      items.map(item =>
        prisma.menuItem.create({
          data: {
            ...item,
            marginPercent: 0.65,
            isAvailable: true,
            isPerishable: false,
            inventory: {
              create: { currentStock: 20, maxStock: 30 },
            },
          },
        })
      )
    );

    return NextResponse.json({ created: created.length, items: created });
  } catch (error) {
    console.error('[menu/items] error:', error);
    return NextResponse.json({ error: 'Failed to create menu items' }, { status: 500 });
  }
}
