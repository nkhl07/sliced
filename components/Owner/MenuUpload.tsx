'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuUploadProps {
  menu: any[];
  onUpdate: (menu: any[]) => void;
}

export default function MenuUpload({ menu, onUpdate }: MenuUploadProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenu = menu.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-black text-stone-900">Menu Intelligence</h2>
          <p className="text-stone-500">Manage your inventory and dynamic pricing thresholds.</p>
        </div>
        <Button className="rounded-xl font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Item
        </Button>
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden border border-stone-100 shadow-sm">
        {/* Table header controls */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Item</th>
                <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Base Price</th>
                <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Target Qty</th>
                <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sold</th>
                <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dynamic Price</th>
                <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenu.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-bold text-stone-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-stone-500">{item.category}</td>
                  <td className="px-6 py-5 font-mono text-stone-600">${item.base_price.toFixed(2)}</td>
                  <td className="px-6 py-5 font-mono text-stone-600">{item.target_daily_quantity}</td>
                  <td className="px-6 py-5 font-mono text-stone-600">{item.current_sold_quantity}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`font-mono font-black px-3 py-1 rounded-lg text-sm ${
                        item.dynamic_price > item.base_price
                          ? 'bg-emerald-50 text-emerald-600'
                          : item.dynamic_price < item.base_price
                          ? 'bg-red-50 text-[#CC0000]'
                          : 'bg-stone-50 text-stone-600'
                      }`}
                    >
                      ${item.dynamic_price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
