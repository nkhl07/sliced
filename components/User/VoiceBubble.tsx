'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Send, Sparkles, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { suggestUpsell } from '@/utils/upsellLogic';

interface VoiceBubbleProps {
  onOrderParsed: (order: { items: any[]; total: number }) => void;
  menu: any[];
  persona: { tone: string; upsellStyle?: string };
}

export default function VoiceBubble({ onOrderParsed, menu, persona }: VoiceBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'confirming'>('idle');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) return;

    recognitionRef.current = new SpeechRec();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      if (transcript) processInput(transcript);
    } else {
      setTranscript('');
      setStatus('listening');
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const processInput = (input: string) => {
    setStatus('processing');
    setTimeout(() => {
      const items: any[] = [];
      const lower = input.toLowerCase();
      menu.forEach(item => {
        if (lower.includes(item.name.toLowerCase())) {
          items.push(item);
        }
      });

      if (items.length > 0) {
        setParsedItems(items);
        setSuggestions(suggestUpsell(items, menu));
        setStatus('confirming');
      } else {
        setStatus('idle');
        setTranscript("I couldn't find those items. Try mentioning a menu item by name!");
      }
    }, 1200);
  };

  const handleTextSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && textInput.trim()) {
      processInput(textInput);
      setTextInput('');
    }
  };

  const confirmOrder = () => {
    const total = parsedItems.reduce((sum, item) => sum + item.dynamic_price, 0);
    onOrderParsed({ items: parsedItems, total });
    setIsOpen(false);
    setStatus('idle');
    setParsedItems([]);
    setSuggestions([]);
    setTranscript('');
  };

  const addSuggestion = (item: any) => {
    setParsedItems(prev => [...prev, item]);
    setSuggestions(prev => prev.filter(s => s.id !== item.id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
          >
            {/* Header */}
            <div className="apple-red p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm uppercase tracking-widest">AI Server</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-stone-50 rounded-2xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center">
                {status === 'idle' && (
                  <p className="text-stone-500 text-sm italic leading-relaxed">
                    {persona.tone === 'friendly'
                      ? "Hi there! I'm your Sliced server. What can I get for you today?"
                      : persona.tone === 'witty'
                      ? "Menu's open, your wallet's waiting. What'll it be?"
                      : persona.tone === 'casual'
                      ? "Hey! What are you feeling today?"
                      : 'Ready for your order. Please state items clearly.'}
                  </p>
                )}
                {status === 'listening' && (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [10, 20, 10] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-[#CC0000] rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-stone-800 font-medium text-sm">{transcript || 'Listening...'}</p>
                  </div>
                )}
                {status === 'processing' && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#CC0000]" />
                    <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Processing Order</p>
                  </div>
                )}
                {status === 'confirming' && (
                  <div className="space-y-4 w-full">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-left">
                        Confirm Items
                      </p>
                      {parsedItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-stone-800 font-medium">{item.name}</span>
                          <span className="text-stone-500 font-mono">${item.dynamic_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {suggestions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-stone-200">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-left flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Recommended for you
                        </p>
                        {suggestions.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => addSuggestion(item)}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs hover:bg-emerald-100 transition-colors"
                          >
                            <span className="font-bold text-emerald-700">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 font-mono">${item.dynamic_price.toFixed(2)}</span>
                              <Plus className="w-3 h-3 text-emerald-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {status === 'confirming' ? (
                <button
                  onClick={confirmOrder}
                  className="w-full py-3 apple-red rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Send to Kitchen
                </button>
              ) : (
                <button
                  onClick={toggleListening}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isListening ? 'bg-stone-800 text-white' : 'apple-red shadow-lg shadow-red-500/20'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isListening ? 'Stop Listening' : 'Start Ordering'}
                </button>
              )}

              <div className="flex items-center gap-2">
                <div className="h-px bg-stone-100 flex-1" />
                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">or type</span>
                <div className="h-px bg-stone-100 flex-1" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your order..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#CC0000] transition-all"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={handleTextSubmit}
                />
                <Send className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-300" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-stone-800 text-white' : 'apple-red animate-float'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
