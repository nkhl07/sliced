// app/api/menu/scan/route.ts
// OCR endpoint — accepts a menu image, uses Claude vision to extract menu items

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const MenuScanSchema = z.object({
  items: z.array(z.object({
    name: z.string().describe('Name of the dish or drink'),
    description: z.string().describe('Description of the item. If none on the menu, write a brief one based on the name.'),
    category: z.enum(['starter', 'main', 'side', 'dessert', 'drink']).describe('Best matching category'),
    basePrice: z.number().describe('Price as a number. Use 0 if not visible.'),
    isVegan: z.boolean().describe('True if explicitly vegan'),
    isVegetarian: z.boolean().describe('True if explicitly vegetarian or vegan'),
    isHalal: z.boolean().describe('True if explicitly halal'),
    isKosher: z.boolean().describe('True if explicitly kosher'),
    isGlutenFree: z.boolean().describe('True if explicitly gluten-free'),
    allergens: z.string().describe('Comma-separated allergens explicitly mentioned (nuts, dairy, gluten, shellfish, eggs). Empty string if none.'),
    imageEmoji: z.string().describe('A single fitting emoji for this dish'),
  }))
});

const SCAN_PROMPT = `You are a menu digitization assistant. Carefully read every item on this menu image.

For each dish or drink you can see, extract:
- The exact name as written
- A description (use the menu text if available, otherwise write a brief one from the name)
- Category: map the menu section to one of: starter (appetizers, starters, small plates), main (entrées, mains, burgers, pasta, pizza), side (sides, extras), dessert (desserts, sweets), drink (beverages, cocktails, wine, beer, soft drinks)
- Price as a plain number (e.g. 12.50). Use 0 if not legible.
- Dietary flags: only mark true if explicitly stated (V, VE, GF, Halal, Kosher, or written out)
- Allergens: only include ones explicitly mentioned on the menu
- A single fitting emoji

Extract every item you can see. Do not skip items.`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: MenuScanSchema,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', image: new Uint8Array(bytes) },
          { type: 'text', text: SCAN_PROMPT },
        ],
      }],
    });

    return Response.json(object);
  } catch (error) {
    console.error('[menu/scan] error:', error);
    return Response.json({ error: 'Failed to scan menu' }, { status: 500 });
  }
}
