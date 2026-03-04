'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Category = 'starter' | 'main' | 'side' | 'dessert' | 'drink';

interface ExtractedItem {
  name: string;
  description: string;
  category: Category;
  basePrice: number;
  isVegan: boolean;
  isVegetarian: boolean;
  isHalal: boolean;
  isKosher: boolean;
  isGlutenFree: boolean;
  allergens: string;
  imageEmoji: string;
}

type Step = 'idle' | 'scanning' | 'review' | 'saving' | 'success';

const CATEGORIES: Category[] = ['starter', 'main', 'side', 'dessert', 'drink'];

const DIETARY_FLAGS: { key: keyof ExtractedItem; label: string }[] = [
  { key: 'isVegan', label: 'Vegan' },
  { key: 'isVegetarian', label: 'Vegetarian' },
  { key: 'isHalal', label: 'Halal' },
  { key: 'isKosher', label: 'Kosher' },
  { key: 'isGlutenFree', label: 'Gluten-Free' },
];

export default function MenuImport() {
  const [step, setStep] = useState<Step>('idle');
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scanImage = async (file: File) => {
    setError('');
    setPreviewUrl(URL.createObjectURL(file));
    setStep('scanning');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/menu/scan', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Scan failed');

      const data = await res.json();
      setItems(data.items ?? []);
      setStep('review');
    } catch {
      setError('Failed to scan the menu. Please try again with a clearer image.');
      setStep('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) scanImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) scanImage(file);
  };

  const updateItem = (index: number, field: keyof ExtractedItem, value: string | boolean | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const confirmImport = async () => {
    setStep('saving');
    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setSavedCount(data.created);
      setStep('success');
    } catch {
      setError('Failed to save items. Please try again.');
      setStep('review');
    }
  };

  const reset = () => {
    setStep('idle');
    setItems([]);
    setError('');
    setPreviewUrl(null);
    setSavedCount(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-black text-stone-900">Import Menu</h2>
        <p className="text-stone-500 mt-1">Upload a photo of your menu — Sage will read it and build your digital menu automatically.</p>
      </div>

      <AnimatePresence mode="wait">

        {/* IDLE — upload area */}
        {step === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-[32px] p-16 text-center transition-all ${
                dragOver
                  ? 'border-stone-900 bg-stone-50'
                  : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50/50'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-lg font-bold text-stone-700">Drop your menu photo here</p>
              <p className="text-stone-400 text-sm mt-1">or click to browse — JPEG, PNG, HEIC supported</p>
            </div>
            {error && <p className="mt-3 text-red-500 text-sm font-bold text-center">{error}</p>}
          </motion.div>
        )}

        {/* SCANNING */}
        {step === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-16"
          >
            {previewUrl && (
              <img src={previewUrl} alt="Menu preview" className="max-h-48 rounded-2xl shadow-lg object-contain" />
            )}
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              <p className="text-stone-600 font-bold">Scanning your menu...</p>
              <p className="text-stone-400 text-sm">Claude is reading every item</p>
            </div>
          </motion.div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-700 font-bold">{items.length} items extracted — review and edit before importing.</p>
                <p className="text-stone-400 text-sm">Fix any mistakes, remove items you don't want, then confirm.</p>
              </div>
              <button onClick={reset} className="flex items-center gap-2 text-stone-400 hover:text-stone-700 text-sm font-bold transition-colors">
                <RotateCcw className="w-4 h-4" /> Re-scan
              </button>
            </div>

            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-white rounded-[24px] border border-stone-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Emoji */}
                    <div className="text-3xl w-12 h-12 flex items-center justify-center bg-stone-50 rounded-xl shrink-0">
                      <input
                        type="text"
                        value={item.imageEmoji}
                        onChange={e => updateItem(i, 'imageEmoji', e.target.value)}
                        className="w-12 text-2xl text-center bg-transparent focus:outline-none"
                        maxLength={2}
                      />
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(i, 'name', e.target.value)}
                        className="w-full font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-200 focus:border-stone-400 focus:outline-none text-base transition-colors"
                        placeholder="Item name"
                      />
                      <textarea
                        value={item.description}
                        onChange={e => updateItem(i, 'description', e.target.value)}
                        rows={2}
                        className="w-full text-sm text-stone-500 bg-transparent border border-transparent hover:border-stone-100 focus:border-stone-200 rounded-lg px-2 py-1 focus:outline-none resize-none transition-colors"
                        placeholder="Description"
                      />
                    </div>

                    {/* Price */}
                    <div className="shrink-0 text-right">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Price</label>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-stone-400 font-bold">$</span>
                        <input
                          type="number"
                          value={item.basePrice}
                          onChange={e => updateItem(i, 'basePrice', parseFloat(e.target.value) || 0)}
                          step="0.50"
                          min="0"
                          className="w-16 text-right font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400 text-sm"
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <button onClick={() => removeItem(i)} className="text-stone-200 hover:text-red-400 transition-colors shrink-0 mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category + dietary flags */}
                  <div className="flex flex-wrap items-center gap-3 pl-16">
                    <select
                      value={item.category}
                      onChange={e => updateItem(i, 'category', e.target.value)}
                      className="text-xs font-bold text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none capitalize"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>

                    {DIETARY_FLAGS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateItem(i, key, !item[key])}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          item[key]
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-50 text-stone-400 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={confirmImport}
                disabled={items.length === 0}
                className="flex-1 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Add {items.length} item{items.length !== 1 ? 's' : ''} to menu
              </button>
              <button onClick={reset} className="px-6 py-4 text-stone-400 hover:text-stone-700 font-bold text-sm transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* SAVING */}
        {step === 'saving' && (
          <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-16"
          >
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
            <p className="text-stone-600 font-bold">Saving items to your menu...</p>
          </motion.div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-16 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <div>
              <p className="text-2xl font-serif font-black text-stone-900">{savedCount} items added</p>
              <p className="text-stone-500 mt-1">Your menu is live — Sage can now take orders for these items.</p>
            </div>
            <button onClick={reset} className="px-8 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-colors text-sm">
              Import another menu
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
