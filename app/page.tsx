'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Store,
  Camera,
  QrCode,
  Zap,
  BarChart3,
  Shield,
  Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load QR scanner to avoid SSR issues
const QRScanner = dynamic(() => import('@/components/User/QRScanner'), { ssr: false });

const FEATURES = [
  {
    icon: ChefHat,
    title: 'AI Voice Ordering',
    description: 'Guests order naturally via voice or text. Sage understands context, quantities, and complex modifications.',
  },
  {
    icon: BarChart3,
    title: 'Dynamic Pricing',
    description: 'Prices adjust in real time based on inventory, demand, and time remaining in the shift.',
  },
  {
    icon: Zap,
    title: 'Inventory-Aware Upselling',
    description: 'Promotes overstocked items, pivots gracefully from sold-out dishes, and maximizes basket value.',
  },
  {
    icon: Shield,
    title: 'Operator Transparency',
    description: 'Every AI decision is logged with reasoning: "Promoted Salmon — 22 units expiring tonight."',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);

  const handleQRScan = (tableId: string) => {
    setShowScanner(false);
    router.push(`/menu?table=${tableId}`);
  };

  // Demo mode: bypass camera and go directly to menu
  const handleDemoOrder = () => {
    router.push('/menu?table=1');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center relative overflow-hidden">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-8 py-6 absolute top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 apple-red rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-stone-900">Sliced.ai</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-stone-500 hover:text-stone-900 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            AI Dashboard
          </Link>
          <button
            onClick={() => router.push('/owner')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-all shadow-sm"
          >
            <Store className="w-3 h-3" />
            Owner Portal
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-12 max-w-2xl"
        >
          {/* Brand */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-sm text-amber-700 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-Native Restaurant OS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-6xl font-black tracking-tighter text-stone-900 leading-tight"
            >
              The restaurant OS<br />
              <span className="text-[#CC0000]">guests actually love</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-stone-500 text-lg max-w-lg mx-auto leading-relaxed"
            >
              Scan your table QR to browse the menu and order with our AI server — or tap{' '}
              <strong className="text-stone-700">Owner Portal</strong> to set up your restaurant.
            </motion.p>
          </div>

          {/* QR Scan CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Main scan button */}
            <button
              onClick={() => setShowScanner(true)}
              className="group relative flex flex-col items-center gap-6 p-12 bg-white border-2 border-stone-200 rounded-[40px] hover:border-[#CC0000] transition-all shadow-xl hover:shadow-2xl hover:shadow-red-500/10"
            >
              <div className="w-24 h-24 bg-stone-50 rounded-3xl flex items-center justify-center group-hover:bg-red-50 transition-colors">
                <Camera className="w-12 h-12 text-stone-400 group-hover:text-[#CC0000] transition-colors" />
              </div>
              <div className="space-y-2">
                <span className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold text-xl flex items-center gap-3">
                  <QrCode className="w-6 h-6" />
                  Scan Table QR
                </span>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                  Tap to open camera
                </p>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-stone-100 group-hover:border-red-100 transition-colors rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-stone-100 group-hover:border-red-100 transition-colors rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-stone-100 group-hover:border-red-100 transition-colors rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-stone-100 group-hover:border-red-100 transition-colors rounded-br-lg" />
            </button>

            {/* Demo link */}
            <button
              onClick={handleDemoOrder}
              className="text-stone-400 text-sm font-bold uppercase tracking-widest hover:text-[#CC0000] transition-colors"
            >
              Skip scan — Browse demo menu →
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full mt-20"
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-white border border-stone-100 rounded-[24px] p-6 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-stone-700" />
              </div>
              <h3 className="font-bold text-stone-900 mb-2 text-sm">{f.title}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex items-center gap-6 text-xs text-stone-400"
        >
          <Link href="/ordering" className="hover:text-stone-700 transition-colors font-bold uppercase tracking-widest">
            AI Voice Ordering
          </Link>
          <span>·</span>
          <Link href="/dashboard" className="hover:text-stone-700 transition-colors font-bold uppercase tracking-widest">
            Operator Dashboard
          </Link>
          <span>·</span>
          <Link href="/owner" className="hover:text-stone-700 transition-colors font-bold uppercase tracking-widest">
            Owner Portal
          </Link>
        </motion.div>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
