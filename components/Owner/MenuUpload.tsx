'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';

interface DbMenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  imageEmoji: string;
  isAvailable: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  isHalal: boolean;
  isKosher: boolean;
  isGlutenFree: boolean;
}

export default function MenuUpload() {
  const [items, setItems] = useState<DbMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/menu/items')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async (item: DbMenuItem) => {
    const updated = { ...item, isAvailable: !item.isAvailable };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    await fetch(`/api/menu/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: updated.isAvailable }),
    });
  };

  const deleteItem = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/menu/items/${id}`, { method: 'DELETE' });
  };

  const filtered = items.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const dietaryBadges = (item: DbMenuItem) => {
    const flags = [];
    if (item.isVegan) flags.push('VE');
    if (item.isVegetarian && !item.isVegan) flags.push('V');
    if (item.isHalal) flags.push('H');
    if (item.isKosher) flags.push('K');
    if (item.isGlutenFree) flags.push('GF');
    return flags;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-black text-stone-900">Menu Intelligence</h2>
          <p className="text-stone-500">
            {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} in your menu`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden border border-stone-100 shadow-sm">
        <div className="p-6 border-b border-stone-100 flex items-center bg-stone-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="font-bold">{items.length === 0 ? 'No items yet — scan a menu to get started.' : 'No results.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Item</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dietary</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-10 h-10 flex items-center justify-center bg-stone-50 rounded-lg">{item.imageEmoji}</span>
                        <div>
                          <p className="font-bold text-stone-900">{item.name}</p>
                          <p className="text-xs text-stone-400 max-w-xs truncate">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-stone-500 capitalize">{item.category}</td>
                    <td className="px-6 py-5 font-mono font-bold text-stone-700">${item.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-5">
                      <div className="flex gap-1 flex-wrap">
                        {dietaryBadges(item).map(badge => (
                          <span key={badge} className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                        item.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
                          title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                        >
                          {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
