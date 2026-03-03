'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, QrCode, Sparkles, ShoppingBag } from 'lucide-react';

interface MenuScreenProps {
  menu: any[];
  activeTable: string | null;
}

const CATEGORIES = ['Appetizers', 'Burgers', 'Salads', 'Pasta', 'Steaks & Ribs', 'Seafood', 'Chicken', 'Desserts', 'Beverages'];

export default function MenuScreen({ menu, activeTable }: MenuScreenProps) {
  const presentCategories = CATEGORIES.filter(cat => menu.some(item => item.category === cat));

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-32">
      {/* Sticky Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 p-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 apple-red rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-stone-900 leading-none">Sliced.ai</h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Digital Menu</p>
            </div>
          </div>
          {activeTable && (
            <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-full border border-stone-100">
              <QrCode className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-bold text-stone-600">Table {activeTable}</span>
            </div>
          )}
        </div>
      </header>

      {/* Category Navigation */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {presentCategories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                const el = document.getElementById(`cat-${cat}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="whitespace-nowrap px-6 py-2 rounded-full bg-white border border-stone-200 text-sm font-bold text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-16">
        {presentCategories.map(category => {
          const items = menu.filter(it => it.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category} id={`cat-${category}`} className="scroll-mt-24 space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-serif font-black text-stone-900">{category}</h2>
                <div className="h-px bg-stone-100 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    className="group bg-white rounded-[32px] overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-stone-100 shadow-sm">
                        <span className="font-mono font-black text-stone-900">${item.dynamic_price.toFixed(2)}</span>
                      </div>
                      {item.dynamic_price > item.base_price && (
                        <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg">
                          <Sparkles className="w-3 h-3" /> High Demand
                        </div>
                      )}
                      {item.dynamic_price < item.base_price && (
                        <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg">
                          ↓ Deal Price
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-stone-900 group-hover:text-[#CC0000] transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">{item.description}</p>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {item.dietary_tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[10px] font-bold uppercase tracking-widest bg-stone-50 text-stone-400 px-3 py-1 rounded-full border border-stone-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-[#CC0000] transition-all transform hover:rotate-12">
                          <ShoppingBag className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating AI CTA banner */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-6">
        <div className="bg-stone-900 text-white rounded-3xl p-4 shadow-2xl flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 apple-red rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">AI Server Active</p>
              <p className="text-sm font-bold">"Ask me for a recommendation!"</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
