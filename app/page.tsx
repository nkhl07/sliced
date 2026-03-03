import Link from 'next/link';
import { ChefHat, BarChart3, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <span className="font-semibold text-lg text-text-primary tracking-tight">sliced.ai</span>
          <span className="badge bg-gold/10 text-gold border border-gold/20 ml-1">MVP</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
            Operator Dashboard
          </Link>
          <Link href="/ordering" className="btn-primary text-sm">
            Open Ordering
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 text-sm text-gold mb-8">
          <Zap size={14} />
          Phase 1 — Front-of-House Brain
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 tracking-tight leading-tight max-w-4xl">
          The AI operating system<br />
          <span className="text-gold">restaurants deserve</span>
        </h1>

        <p className="text-xl text-text-secondary max-w-2xl mb-12 leading-relaxed">
          Sage is your AI server — fluent in the menu, aware of inventory in real time,
          and wired to maximize revenue without sacrificing hospitality.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/ordering" className="btn-primary text-base px-8 py-3">
            Try Guest Ordering →
          </Link>
          <Link href="/dashboard" className="btn-secondary text-base px-8 py-3">
            View Operator Dashboard
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full text-left">
          {features.map(f => (
            <div key={f.title} className="card p-6">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <f.icon size={18} className="text-gold" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Context */}
      <section className="px-8 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-text-secondary text-sm mb-6">Demo Restaurant: <span className="text-text-primary font-medium">The Olive Branch</span> — Fine Mediterranean Dining</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl mb-2">🐟</div>
              <p className="text-sm font-medium text-text-primary">Grilled Salmon</p>
              <p className="text-xs text-amber-400 mt-1">Overstocked — AI will discount & promote</p>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl mb-2">🥙</div>
              <p className="text-sm font-medium text-text-primary">Lamb Shawarma</p>
              <p className="text-xs text-crimson mt-1">High demand + low stock → price premium</p>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl mb-2">🍢</div>
              <p className="text-sm font-medium text-text-primary">Lamb Kofta</p>
              <p className="text-xs text-text-secondary mt-1">Out of stock — AI pivots gracefully</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-8 py-6 border-t border-white/5 text-center text-text-secondary text-xs">
        sliced.ai MVP Phase 1 · Built with Next.js, Vercel AI SDK, Claude claude-sonnet-4-6, Prisma
      </footer>
    </main>
  );
}

const features = [
  {
    icon: ChefHat,
    title: 'Semantic Menu Intelligence',
    description: 'Answers complex dietary questions, understands Halal/Kosher requirements, and knows every ingredient.',
  },
  {
    icon: BarChart3,
    title: 'Dynamic Pricing',
    description: 'Prices adjust in real time based on supply, demand, and time remaining in the shift.',
  },
  {
    icon: Zap,
    title: 'Inventory-Aware Upselling',
    description: 'Promotes overstocked items, pivots gracefully from sold-out dishes, and tracks basket composition.',
  },
  {
    icon: Shield,
    title: 'Operator Transparency',
    description: 'Every AI decision is logged with the reason: "Promoted Salmon — 22 units expiring tonight."',
  },
];
