# sliced.ai — MVP Phase 1: Front-of-House Brain

> An AI-native operating system for restaurants. Phase 1 ships the **conversational ordering layer** — a genius AI server that owns the front-of-house data funnel.

---

## What's Built

### The Guest Experience
- **`/ordering`** — Full conversational ordering interface powered by **Sage**, the AI server
- Natural language menu browsing with deep ingredient/allergen/dietary knowledge
- Real-time inventory checks before confirming availability
- Seamless order building with live cart sidebar

### The Revenue Engine (running under the hood)
- **Dynamic Pricing** — Prices adjust in real time based on:
  - Inventory levels (overstocked perishables → discount; low stock → scarcity premium)
  - Tonight's demand (hot items command a premium)
  - Shift time remaining (deeper discounts as close approaches)
- **Smart Upselling** — Basket analysis suggests pairings based on margin + inventory gaps
- **Graceful Pivots** — When an item sells out, Sage smoothly redirects to alternatives

### The Operator View
- **`/dashboard`** — Live transparency into every AI decision
  - "Promoted Salmon — 22 units expiring tonight, applied 18% discount"
  - "Lamb Shawarma: demand premium active (15 orders tonight)"
  - Color-coded inventory grid with real-time stock levels

---

## Demo Restaurant: The Olive Branch

Pre-seeded with three scenarios that showcase all AI capabilities:

| Item | Scenario | AI Behavior |
|------|----------|-------------|
| Grilled Salmon | Overstocked (22 units, max 12) | Discounts ~18% and proactively recommends |
| Lamb Shawarma | High demand (15 orders) + Low stock (3 left) | Applies demand premium, hints at scarcity |
| Lamb Kofta | Out of stock | Pivots gracefully to Shawarma or Beef Tagine |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| AI / LLM | Claude claude-sonnet-4-6 via Vercel AI SDK v4 |
| Database | Prisma + SQLite (swap provider = "postgresql" for prod) |
| Styling | Tailwind CSS (custom Mediterranean dark theme) |
| Language | TypeScript |

---

## Setup (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY="sk-ant-..."
DATABASE_URL="file:./prisma/dev.db"
```
Get your key at [console.anthropic.com](https://console.anthropic.com).

### 3. Initialize the database
```bash
npx prisma db push
npm run db:seed
```

### 4. Start the dev server
```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
sliced/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── ordering/page.tsx         # Guest ordering interface
│   ├── dashboard/page.tsx        # Operator dashboard (SSR)
│   └── api/
│       ├── chat/route.ts         # AI streaming endpoint (Sage)
│       ├── orders/route.ts       # Order state API
│       └── dashboard/route.ts    # Dashboard data API
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx     # Main chat UI with useChat
│   │   └── OrderSidebar.tsx      # Live cart panel
│   └── dashboard/
│       ├── InventoryGrid.tsx     # Color-coded stock levels
│       ├── AIDecisionsLog.tsx    # Explanation feed
│       └── MetricsBar.tsx        # Revenue KPIs + pricing events
├── lib/
│   ├── db.ts                     # Prisma singleton
│   ├── ai/
│   │   ├── tools.ts              # 6 AI tools (search, inventory, order, etc.)
│   │   └── prompts.ts            # Sage's system prompt
│   └── pricing/
│       └── dynamic.ts            # Pricing engine (inventory + demand + time)
└── prisma/
    ├── schema.prisma             # DB schema
    └── seed.ts                   # The Olive Branch demo data
```

---

## AI Tools Available to Sage

| Tool | What it does |
|------|-------------|
| searchMenu | Filter by category, dietary flags, allergens, text query |
| checkInventory | Real-time stock check before confirming availability |
| getDynamicPrice | Returns current price after demand/inventory/time adjustments |
| addToOrder | Adds confirmed item, decrements stock, recalculates total |
| getOrderSummary | Returns current cart for the session |
| getRecommendations | Basket analysis: margin-aware pairing suggestions |
| finalizeOrder | Submits order, transitions status to finalized |

---

## Upgrading to Production

1. **Database**: Change `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma`
2. **Hosting**: Deploy to Vercel (set env vars in dashboard)
3. **Auth**: Add Clerk or NextAuth for operator dashboard
4. **POS Integration**: Replace `addToOrder` tool with a call to your POS API
5. **Real Inventory**: Connect `Inventory` table to your inventory management system

---

## Phase 2 Roadmap

- **Labor Optimization** — AI schedules staff based on predicted demand from ordering patterns
- **Supply Chain** — Auto-generate purchase orders when items hit reorder threshold
- **Multi-location** — Shared demand signals across restaurant group
- **Voice Ordering** — Whisper STT + Sage + TTS pipeline
