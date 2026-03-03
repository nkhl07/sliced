// prisma/seed.ts
// Seed data for The Olive Branch — Fine Mediterranean Dining
// Demo data showcases all sliced.ai capabilities:
//   - Halal/dietary intelligence
//   - Overstocked items (Grilled Salmon → AI will promote & discount)
//   - Out-of-stock item (Lamb Kofta → AI will pivot gracefully)
//   - High-demand item (Lamb Shawarma → AI will apply demand pricing)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌿 Seeding The Olive Branch...');

  // Clear existing data
  await prisma.pricingEvent.deleteMany();
  await prisma.aIDecision.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.shiftConfig.deleteMany();
  await prisma.menuItem.deleteMany();

  // ─── MENU ITEMS ───────────────────────────────────────────────────────────

  const menuItems = await prisma.$transaction([

    // STARTERS
    prisma.menuItem.create({ data: {
      name: 'Hummus & Warm Pita',
      description: 'House-made hummus with roasted garlic, olive oil, and za\'atar. Served with freshly baked pita triangles.',
      category: 'starter',
      basePrice: 12.00,
      marginPercent: 0.78,
      isPerishable: false,
      isHalal: true, isKosher: false, isVegan: true, isVegetarian: true, isGlutenFree: false,
      allergens: 'gluten, sesame',
      imageEmoji: '🫙',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Falafel Platter',
      description: 'Crispy chickpea falafel with tahini, cucumber-tomato salsa, and pickled turnips. A guest favorite.',
      category: 'starter',
      basePrice: 14.00,
      marginPercent: 0.82,
      isPerishable: false,
      isHalal: true, isKosher: false, isVegan: true, isVegetarian: true, isGlutenFree: false,
      allergens: 'gluten, sesame',
      imageEmoji: '🧆',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Lamb Kofta Skewers',
      description: 'Hand-rolled spiced lamb skewers over saffron rice with grilled peppers and yogurt sauce.',
      category: 'starter',
      basePrice: 16.00,
      marginPercent: 0.58,
      isPerishable: true,
      isAvailable: true, // will be set out-of-stock via inventory
      isHalal: true, isKosher: false, isVegan: false, isVegetarian: false, isGlutenFree: true,
      allergens: 'dairy',
      imageEmoji: '🍢',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Spanakopita',
      description: 'Golden phyllo pastry filled with spinach, feta, and fresh herbs. Crisp, buttery, and satisfying.',
      category: 'starter',
      basePrice: 13.00,
      marginPercent: 0.75,
      isPerishable: false,
      isHalal: false, isKosher: false, isVegan: false, isVegetarian: true, isGlutenFree: false,
      allergens: 'gluten, dairy, eggs',
      imageEmoji: '🥧',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Mezze Board',
      description: 'A curated spread: baba ganoush, muhammara, olives, dolmades, and warm pita. Perfect for sharing.',
      category: 'starter',
      basePrice: 22.00,
      marginPercent: 0.71,
      isPerishable: false,
      isHalal: true, isKosher: false, isVegan: true, isVegetarian: true, isGlutenFree: false,
      allergens: 'gluten, sesame, nuts',
      imageEmoji: '🫕',
    }}),

    // MAINS
    prisma.menuItem.create({ data: {
      name: 'Lamb Shawarma',
      description: 'Slow-roasted marinated lamb carved fresh, served in house-baked flatbread with garlic sauce, pickles, and fries.',
      category: 'main',
      basePrice: 24.00,
      marginPercent: 0.60,
      isPerishable: true,
      isHalal: true, isKosher: false, isVegan: false, isVegetarian: false, isGlutenFree: false,
      allergens: 'gluten, dairy, sesame',
      imageEmoji: '🥙',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Grilled Salmon',
      description: 'Atlantic salmon fillet with chermoula herb crust, lemon-caper butter, wilted greens, and roasted potatoes.',
      category: 'main',
      basePrice: 28.00,
      marginPercent: 0.55,
      isPerishable: true,
      isHalal: false, isKosher: false, isVegan: false, isVegetarian: false, isGlutenFree: true,
      allergens: 'fish, dairy',
      imageEmoji: '🐟',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Chicken Kebab Plate',
      description: 'Marinated grilled chicken thighs with turmeric rice, charred vegetables, and house garlic sauce.',
      category: 'main',
      basePrice: 22.00,
      marginPercent: 0.65,
      isPerishable: true,
      isHalal: true, isKosher: false, isVegan: false, isVegetarian: false, isGlutenFree: true,
      allergens: 'dairy',
      imageEmoji: '🍗',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Mushroom & Truffle Risotto',
      description: 'Arborio rice with wild mushrooms, white truffle oil, aged Parmigiano, and fresh thyme. Rich and earthy.',
      category: 'main',
      basePrice: 20.00,
      marginPercent: 0.72,
      isPerishable: false,
      isHalal: false, isKosher: false, isVegan: false, isVegetarian: true, isGlutenFree: true,
      allergens: 'dairy',
      imageEmoji: '🍄',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Slow-Braised Beef Tagine',
      description: 'Moroccan-style braised beef with preserved lemon, olives, and apricots over couscous. A kitchen signature.',
      category: 'main',
      basePrice: 26.00,
      marginPercent: 0.62,
      isPerishable: true,
      isHalal: true, isKosher: false, isVegan: false, isVegetarian: false, isGlutenFree: false,
      allergens: 'gluten',
      imageEmoji: '🫕',
    }}),

    // SIDES
    prisma.menuItem.create({ data: {
      name: 'Saffron Rice Pilaf',
      description: 'Fragrant basmati rice with saffron, toasted almonds, and golden raisins.',
      category: 'side',
      basePrice: 6.00,
      marginPercent: 0.85,
      isPerishable: false,
      isHalal: true, isKosher: false, isVegan: true, isVegetarian: true, isGlutenFree: true,
      allergens: 'nuts',
      imageEmoji: '🍚',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Fattoush Salad',
      description: 'Crispy pita chips with romaine, cucumber, tomato, radish, sumac dressing, and fresh mint.',
      category: 'side',
      basePrice: 11.00,
      marginPercent: 0.80,
      isPerishable: false,
      isHalal: true, isKosher: false, isVegan: true, isVegetarian: true, isGlutenFree: false,
      allergens: 'gluten',
      imageEmoji: '🥗',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Roasted Root Vegetables',
      description: 'Seasonal root vegetables with harissa, pomegranate molasses, and herb oil. Caramelized and vibrant.',
      category: 'side',
      basePrice: 9.00,
      marginPercent: 0.82,
      isPerishable: false,
      isHalal: true, isKosher: true, isVegan: true, isVegetarian: true, isGlutenFree: true,
      allergens: '',
      imageEmoji: '🥕',
    }}),

    // DESSERTS
    prisma.menuItem.create({ data: {
      name: 'Baklava',
      description: 'Layers of crispy phyllo with pistachios and walnuts, soaked in rose water honey syrup.',
      category: 'dessert',
      basePrice: 8.00,
      marginPercent: 0.88,
      isPerishable: false,
      isHalal: true, isKosher: false, isVegan: false, isVegetarian: true, isGlutenFree: false,
      allergens: 'gluten, nuts, dairy',
      imageEmoji: '🍯',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Chocolate Lava Cake',
      description: 'Warm dark chocolate cake with a molten center, served with vanilla bean ice cream and caramel dust.',
      category: 'dessert',
      basePrice: 10.00,
      marginPercent: 0.80,
      isPerishable: false,
      isHalal: false, isKosher: false, isVegan: false, isVegetarian: true, isGlutenFree: false,
      allergens: 'gluten, dairy, eggs',
      imageEmoji: '🍫',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Mango & Cardamom Sorbet',
      description: 'Dairy-free Alphonso mango sorbet with cardamom and fresh lime zest. Light and refreshing.',
      category: 'dessert',
      basePrice: 7.00,
      marginPercent: 0.85,
      isPerishable: true,
      isHalal: true, isKosher: true, isVegan: true, isVegetarian: true, isGlutenFree: true,
      allergens: '',
      imageEmoji: '🥭',
    }}),

    // DRINKS
    prisma.menuItem.create({ data: {
      name: 'House Red or White Wine',
      description: 'Curated Mediterranean wines by the glass. Ask your server for tonight\'s selection.',
      category: 'drink',
      basePrice: 12.00,
      marginPercent: 0.75,
      isPerishable: false,
      isHalal: false, isKosher: false, isVegan: true, isVegetarian: true, isGlutenFree: true,
      allergens: 'sulphites',
      imageEmoji: '🍷',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Fresh Mint Lemonade',
      description: 'Squeezed to order: Sicilian lemons, fresh mint, and a touch of orange blossom water. Non-alcoholic.',
      category: 'drink',
      basePrice: 5.00,
      marginPercent: 0.90,
      isPerishable: false,
      isHalal: true, isKosher: true, isVegan: true, isVegetarian: true, isGlutenFree: true,
      allergens: '',
      imageEmoji: '🍋',
    }}),

    prisma.menuItem.create({ data: {
      name: 'Moroccan Mint Tea',
      description: 'Traditional gunpowder green tea with fresh spearmint leaves. Poured tableside from height.',
      category: 'drink',
      basePrice: 4.00,
      marginPercent: 0.92,
      isPerishable: false,
      isHalal: true, isKosher: true, isVegan: true, isVegetarian: true, isGlutenFree: true,
      allergens: '',
      imageEmoji: '🍵',
    }}),
  ]);

  console.log(`✅ Created ${menuItems.length} menu items`);

  // Get IDs by name for inventory setup
  const allItems = await prisma.menuItem.findMany();
  const byName = (name: string) => allItems.find(i => i.name === name)!;

  // ─── INVENTORY ────────────────────────────────────────────────────────────
  // Key demo states:
  //   - Grilled Salmon:   OVERSTOCKED  (expires tomorrow → AI will discount & promote)
  //   - Lamb Kofta:       OUT OF STOCK (0 units → AI will pivot gracefully)
  //   - Lamb Shawarma:    LOW STOCK    (3 left after high demand → AI will note scarcity)
  //   - Everything else:  Normal levels

  await prisma.inventory.createMany({ data: [
    { menuItemId: byName('Hummus & Warm Pita').id,         currentStock: 25, maxStock: 30 },
    { menuItemId: byName('Falafel Platter').id,            currentStock: 18, maxStock: 25 },
    { menuItemId: byName('Lamb Kofta Skewers').id,         currentStock: 0,  maxStock: 20 }, // OUT
    { menuItemId: byName('Spanakopita').id,                currentStock: 14, maxStock: 20 },
    { menuItemId: byName('Mezze Board').id,                currentStock: 12, maxStock: 15 },
    { menuItemId: byName('Lamb Shawarma').id,              currentStock: 3,  maxStock: 30 }, // LOW
    { menuItemId: byName('Grilled Salmon').id,             currentStock: 22, maxStock: 12 }, // OVERSTOCKED
    { menuItemId: byName('Chicken Kebab Plate').id,        currentStock: 20, maxStock: 25 },
    { menuItemId: byName('Mushroom & Truffle Risotto').id, currentStock: 15, maxStock: 20 },
    { menuItemId: byName('Slow-Braised Beef Tagine').id,   currentStock: 10, maxStock: 20 },
    { menuItemId: byName('Saffron Rice Pilaf').id,         currentStock: 40, maxStock: 50 },
    { menuItemId: byName('Fattoush Salad').id,             currentStock: 22, maxStock: 30 },
    { menuItemId: byName('Roasted Root Vegetables').id,    currentStock: 18, maxStock: 25 },
    { menuItemId: byName('Baklava').id,                    currentStock: 30, maxStock: 40 },
    { menuItemId: byName('Chocolate Lava Cake').id,        currentStock: 16, maxStock: 20 },
    { menuItemId: byName('Mango & Cardamom Sorbet').id,    currentStock: 8,  maxStock: 20 },
    { menuItemId: byName('House Red or White Wine').id,    currentStock: 45, maxStock: 60 },
    { menuItemId: byName('Fresh Mint Lemonade').id,        currentStock: 50, maxStock: 60 },
    { menuItemId: byName('Moroccan Mint Tea').id,          currentStock: 60, maxStock: 80 },
  ]});

  console.log('✅ Inventory seeded');

  // ─── SHIFT CONFIG ─────────────────────────────────────────────────────────
  // Tonight's shift: 5pm → 11pm
  const tonight = new Date();
  tonight.setHours(17, 0, 0, 0);
  const shiftEnd = new Date();
  shiftEnd.setHours(23, 0, 0, 0);

  await prisma.shiftConfig.create({
    data: { shiftStart: tonight, shiftEnd, isActive: true }
  });

  console.log('✅ Shift config set');

  // ─── HISTORICAL DEMAND (simulated prior orders for pricing context) ────────
  // This simulates 15 Lamb Shawarma orders already placed tonight
  // so the dynamic pricing engine knows it's a hot item.

  const demoSession = 'demo-historical';
  const demoOrder = await prisma.order.create({
    data: {
      sessionId: demoSession,
      status: 'finalized',
      tableNum: 1,
      subtotal: 24 * 15,
      tax: 24 * 15 * 0.0875,
      total: 24 * 15 * 1.0875,
    }
  });

  const shawarma = byName('Lamb Shawarma');
  await prisma.orderItem.createMany({ data: Array.from({ length: 15 }, () => ({
    orderId: demoOrder.id,
    menuItemId: shawarma.id,
    quantity: 1,
    priceAtOrder: 24.00,
  }))});

  console.log('✅ Historical demand data seeded (15x Lamb Shawarma tonight)');

  // ─── INITIAL AI DECISIONS LOG ─────────────────────────────────────────────
  const salmon = byName('Grilled Salmon');

  await prisma.aIDecision.createMany({ data: [
    {
      menuItemId: salmon.id,
      decisionType: 'dynamic_price',
      reason: 'Grilled Salmon is 83% overstocked (22/12 units). Item is perishable. Applying 18% discount to move inventory before close.',
      metadata: JSON.stringify({ basePrice: 28, dynamicPrice: 22.95, stockLevel: 22, maxStock: 12 }),
    },
    {
      menuItemId: shawarma.id,
      decisionType: 'dynamic_price',
      reason: 'Lamb Shawarma has seen 15 orders tonight — the highest demand item. Low stock (3 remaining). Applying 10% demand premium.',
      metadata: JSON.stringify({ basePrice: 24, dynamicPrice: 26.40, stockLevel: 3, demandCount: 15 }),
    },
    {
      menuItemId: byName('Lamb Kofta Skewers').id,
      decisionType: 'out_of_stock_pivot',
      reason: 'Lamb Kofta Skewers are out of stock. AI is configured to recommend Lamb Shawarma or Beef Tagine as alternatives.',
      metadata: JSON.stringify({ alternatives: ['Lamb Shawarma', 'Slow-Braised Beef Tagine'] }),
    },
  ]});

  console.log('✅ Initial AI decisions logged');

  console.log('\n🎉 The Olive Branch is ready to serve!\n');
  console.log('Demo highlights:');
  console.log('  🐟 Grilled Salmon  — OVERSTOCKED (22 units, max 12) → AI will discount & promote');
  console.log('  🥙 Lamb Shawarma  — HIGH DEMAND (15 orders tonight) + LOW STOCK (3 left)');
  console.log('  🍢 Lamb Kofta     — OUT OF STOCK → AI will pivot gracefully');
  console.log('  🧆 Falafel Platter — High margin (82%) → AI will recommend for upsell\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
