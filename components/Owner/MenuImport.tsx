'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, CheckCircle2, RotateCcw, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Category = 'starter' | 'main' | 'side' | 'dessert' | 'drink';

interface MenuItem {
  id?: number;
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
  isAvailable?: boolean;
}

type Step = 'idle' | 'scanning' | 'review' | 'saving' | 'manage';

const CATEGORIES: Category[] = ['starter', 'main', 'side', 'dessert', 'drink'];

const DIETARY_FLAGS: { key: keyof MenuItem; label: string }[] = [
  { key: 'isVegan', label: 'Vegan' },
  { key: 'isVegetarian', label: 'Vegetarian' },
  { key: 'isHalal', label: 'Halal' },
  { key: 'isKosher', label: 'Kosher' },
  { key: 'isGlutenFree', label: 'GF' },
];

// Editable item card — used in both review and manage modes
function ItemCard({
  item,
  onChange,
  onDelete,
  onSave,
  saving,
  dirty,
}: {
  item: MenuItem;
  onChange: (field: keyof MenuItem, value: string | boolean | number) => void;
  onDelete: () => void;
  onSave?: () => void;
  saving?: boolean;
  dirty?: boolean;
}) {
  return (
    <div className="bg-white rounded-[24px] border border-stone-100 shadow-sm p-6 space-y-4">
      <div className="flex items-start gap-4">
        {/* Emoji */}
        <input
          type="text"
          value={item.imageEmoji}
          onChange={e => onChange('imageEmoji', e.target.value)}
          className="w-12 h-12 text-2xl text-center bg-stone-50 rounded-xl focus:outline-none shrink-0"
          maxLength={2}
        />

        {/* Name + description */}
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={item.name}
            onChange={e => onChange('name', e.target.value)}
            className="w-full font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-200 focus:border-stone-400 focus:outline-none text-base transition-colors"
            placeholder="Item name"
          />
          <textarea
            value={item.description}
            onChange={e => onChange('description', e.target.value)}
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
              onChange={e => onChange('basePrice', parseFloat(e.target.value) || 0)}
              step="0.50"
              min="0"
              className="w-16 text-right font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400 text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {onSave && (
            <button
              onClick={onSave}
              disabled={!dirty || saving}
              className={`p-1.5 rounded-lg transition-colors ${
                dirty ? 'text-emerald-500 hover:bg-emerald-50' : 'text-stone-200 cursor-default'
              }`}
              title="Save changes"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          )}
          {item.id !== undefined && (
            <button
              onClick={() => onChange('isAvailable', !item.isAvailable)}
              className={`p-1.5 rounded-lg transition-colors ${
                item.isAvailable ? 'text-stone-400 hover:text-stone-600' : 'text-red-300 hover:text-red-500'
              }`}
              title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
            >
              {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 text-stone-200 hover:text-red-400 rounded-lg transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category + dietary */}
      <div className="flex flex-wrap items-center gap-2 pl-16">
        <select
          value={item.category}
          onChange={e => onChange('category', e.target.value)}
          className="text-xs font-bold text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none capitalize"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        {DIETARY_FLAGS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key, !item[key])}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
              item[key]
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-stone-50 text-stone-400 border-stone-200 hover:border-stone-300'
            }`}
          >
            {label}
          </button>
        ))}

        {item.id !== undefined && !item.isAvailable && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-400 border border-red-100">
            Unavailable
          </span>
        )}
      </div>
    </div>
  );
}

export default function MenuImport() {
  const [step, setStep] = useState<Step>('idle');
  const [scanItems, setScanItems] = useState<MenuItem[]>([]);
  const [dbItems, setDbItems] = useState<MenuItem[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDbItems = useCallback(async () => {
    setLoadingDb(true);
    try {
      const res = await fetch('/api/menu/items');
      const data = await res.json();
      setDbItems(data.items ?? []);
    } finally {
      setLoadingDb(false);
    }
  }, []);

  // Load DB items on mount to show "Manage" option
  useEffect(() => { loadDbItems(); }, [loadDbItems]);

  // ── Scan flow ──────────────────────────────────────────────────────────────

  const scanImage = async (file: File) => {
    setError('');
    setPreviewUrl(URL.createObjectURL(file));
    setStep('scanning');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/menu/scan', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setScanItems(data.items ?? []);
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

  const updateScanItem = (index: number, field: keyof MenuItem, value: string | boolean | number) => {
    setScanItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const confirmImport = async () => {
    setStep('saving');
    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: scanItems }),
      });
      if (!res.ok) throw new Error();
      await loadDbItems();
      setStep('manage');
    } catch {
      setError('Failed to save items. Please try again.');
      setStep('review');
    }
  };

  // ── Manage flow ────────────────────────────────────────────────────────────

  const updateDbItem = (id: number, field: keyof MenuItem, value: string | boolean | number) => {
    setDbItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setDirtyIds(prev => new Set(prev).add(id));

    // If toggling availability, save immediately
    if (field === 'isAvailable') {
      saveItem(id, { [field]: value as boolean });
    }
  };

  const saveItem = async (id: number, overrides?: Partial<MenuItem>) => {
    setSavingIds(prev => new Set(prev).add(id));
    try {
      const item = dbItems.find(i => i.id === id)!;
      const payload = overrides ?? {
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        isVegan: item.isVegan,
        isVegetarian: item.isVegetarian,
        isHalal: item.isHalal,
        isKosher: item.isKosher,
        isGlutenFree: item.isGlutenFree,
        allergens: item.allergens,
        imageEmoji: item.imageEmoji,
        isAvailable: item.isAvailable,
      };
      await fetch(`/api/menu/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setDirtyIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const deleteDbItem = async (id: number) => {
    await fetch(`/api/menu/items/${id}`, { method: 'DELETE' });
    setDbItems(prev => prev.filter(i => i.id !== id));
  };

  const resetToIdle = () => {
    setStep('idle');
    setScanItems([]);
    setError('');
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-stone-900">Menu Manager</h2>
          <p className="text-stone-500 mt-1">
            {step === 'manage' || (step === 'idle' && dbItems.length > 0)
              ? `${dbItems.length} item${dbItems.length !== 1 ? 's' : ''} in your menu`
              : 'Upload a photo of your menu to get started.'}
          </p>
        </div>
        {(step === 'manage' || (step === 'idle' && dbItems.length > 0)) && (
          <button
            onClick={resetToIdle}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors"
          >
            <Upload className="w-4 h-4" /> Scan new menu
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* IDLE — upload area or jump to manage */}
        {step === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-[32px] p-16 text-center transition-all ${
                dragOver ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50/50'
              }`}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <Upload className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-lg font-bold text-stone-700">Drop your menu photo here</p>
              <p className="text-stone-400 text-sm mt-1">or click to browse — JPEG, PNG, HEIC supported</p>
            </div>
            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

            {dbItems.length > 0 && (
              <button
                onClick={() => setStep('manage')}
                className="w-full py-3 border border-stone-200 rounded-2xl text-stone-500 font-bold text-sm hover:border-stone-400 hover:text-stone-700 transition-all"
              >
                View & edit {dbItems.length} existing item{dbItems.length !== 1 ? 's' : ''}
              </button>
            )}
          </motion.div>
        )}

        {/* SCANNING */}
        {step === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-16"
          >
            {previewUrl && <img src={previewUrl} alt="Menu preview" className="max-h-48 rounded-2xl shadow-lg object-contain" />}
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              <p className="text-stone-600 font-bold">Scanning your menu...</p>
              <p className="text-stone-400 text-sm">Claude is reading every item</p>
            </div>
          </motion.div>
        )}

        {/* REVIEW — before saving to DB */}
        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-700 font-bold">{scanItems.length} items extracted — review and edit before importing.</p>
                <p className="text-stone-400 text-sm">Fix any mistakes, remove unwanted items, then confirm.</p>
              </div>
              <button onClick={resetToIdle} className="flex items-center gap-2 text-stone-400 hover:text-stone-700 text-sm font-bold transition-colors">
                <RotateCcw className="w-4 h-4" /> Re-scan
              </button>
            </div>

            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

            <div className="space-y-3">
              {scanItems.map((item, i) => (
                <ItemCard
                  key={i}
                  item={item}
                  onChange={(field, value) => updateScanItem(i, field, value)}
                  onDelete={() => setScanItems(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={confirmImport}
                disabled={scanItems.length === 0}
                className="flex-1 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Add {scanItems.length} item{scanItems.length !== 1 ? 's' : ''} to menu
              </button>
              <button onClick={resetToIdle} className="px-6 py-4 text-stone-400 hover:text-stone-700 font-bold text-sm transition-colors">
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

        {/* MANAGE — view and edit all DB items */}
        {step === 'manage' && (
          <motion.div key="manage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {loadingDb ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
              </div>
            ) : dbItems.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <p className="font-bold">No menu items yet.</p>
                <p className="text-sm mt-1">Scan a menu photo to get started.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                    {dirtyIds.size > 0 ? `${dirtyIds.size} unsaved change${dirtyIds.size !== 1 ? 's' : ''}` : 'All changes saved'}
                  </p>
                  {dirtyIds.size > 0 && (
                    <button
                      onClick={() => dirtyIds.forEach(id => saveItem(id))}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors"
                    >
                      <Save className="w-3 h-3" /> Save all
                    </button>
                  )}
                </div>

                {dbItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onChange={(field, value) => updateDbItem(item.id!, field, value)}
                    onDelete={() => deleteDbItem(item.id!)}
                    onSave={() => saveItem(item.id!)}
                    saving={savingIds.has(item.id!)}
                    dirty={dirtyIds.has(item.id!)}
                  />
                ))}
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
