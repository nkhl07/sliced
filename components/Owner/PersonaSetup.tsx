'use client';

import React from 'react';
import { Sparkles, Zap, ShieldCheck, MessageSquare, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersonaConfig {
  tone: string;
  upsellStyle?: string;
}

interface PersonaSetupProps {
  config: PersonaConfig;
  onUpdate: (config: PersonaConfig) => void;
}

const TONES = [
  { id: 'friendly', label: 'Friendly', icon: Zap, desc: 'Warm, welcoming, and uses emojis.' },
  { id: 'professional', label: 'Efficient', icon: ShieldCheck, desc: 'Fast, direct, and highly precise.' },
  { id: 'casual', label: 'Casual', icon: MessageSquare, desc: 'Relaxed, like a local regular.' },
  { id: 'witty', label: 'Witty', icon: Sparkles, desc: 'Playful, charming, and clever.' },
];

const PREVIEW_MESSAGES: Record<string, string> = {
  friendly: "Hey there! 👋 Our Classic Cheeseburger is absolutely hitting the spot today. Want to make it a meal?",
  professional: 'Welcome. I recommend the Classic Cheeseburger, currently our highest-rated entree. Shall I add that to your order?',
  casual: "Yo! Honestly, the cheeseburger is where it's at. You want one?",
  witty: "If I had a stomach, I'd be eating the cheeseburger. Since I don't, you should probably do the honors. Interested?",
};

export default function PersonaSetup({ config, onUpdate }: PersonaSetupProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-black text-stone-900">AI Persona Design</h2>
        <p className="text-stone-500">Customize how your digital server interacts with guests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tone Selection */}
        <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Volume2 className="w-5 h-5 text-stone-900" />
            <h3 className="text-xl font-serif font-bold text-stone-900">Tone of Voice</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {TONES.map(tone => (
              <button
                key={tone.id}
                onClick={() => onUpdate({ ...config, tone: tone.id })}
                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
                  config.tone === tone.id
                    ? 'border-stone-900 bg-stone-50'
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${
                    config.tone === tone.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  <tone.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-stone-900">{tone.label}</p>
                  <p className="text-xs text-stone-500">{tone.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-stone-900 rounded-[32px] p-8 text-white space-y-6 relative overflow-hidden">
          <Sparkles className="absolute -top-10 -right-10 w-40 h-40 text-white/5 rotate-12" />
          <h3 className="text-xl font-serif font-bold">Live Preview</h3>
          <div className="space-y-4 relative z-10">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Guest</p>
              <p className="text-sm">&ldquo;What&apos;s good today?&rdquo;</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-4 border border-white/20 ml-8">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                AI Server ({config.tone})
              </p>
              <p className="text-sm italic">{PREVIEW_MESSAGES[config.tone] || PREVIEW_MESSAGES.friendly}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
            onClick={() => {
              // In a real app, this would persist to the database
              alert('Persona saved!');
            }}
          >
            Save Persona Configuration
          </Button>
        </div>
      </div>

      {/* Upsell Strategy */}
      <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm">
        <h3 className="text-xl font-serif font-bold text-stone-900 mb-6">Upsell Strategy</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['passive', 'suggestive', 'aggressive'] as const).map(style => (
            <button
              key={style}
              onClick={() => onUpdate({ ...config, upsellStyle: style })}
              className={`p-6 rounded-2xl border-2 transition-all text-left capitalize font-bold ${
                config.upsellStyle === style
                  ? 'border-stone-900 bg-stone-50 text-stone-900'
                  : 'border-stone-100 text-stone-400 hover:border-stone-200'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
