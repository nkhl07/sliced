'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Store,
  Sparkles,
  Camera,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  User,
  MessageCircle,
  TrendingUp,
  Phone,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface OwnerData {
  username: string;
  password: string;
  identityVerified: boolean;
  restaurantName: string;
  tableCount: number;
  persona: {
    tone: string;
    upsellStyle: string;
  };
}

interface OnboardingProps {
  onComplete: (data: OwnerData) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [formData, setFormData] = useState<OwnerData>({
    username: '',
    password: '',
    identityVerified: false,
    restaurantName: '',
    tableCount: 5,
    persona: { tone: 'friendly', upsellStyle: 'suggestive' },
  });

  const handleNext = () => setStep(s => s + 1);

  const steps = [
    {
      title: 'Owner Authentication',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-stone-500 text-sm leading-relaxed">
            Secure your Sliced.ai Mission Control with administrative credentials.
          </p>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Username"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Identity Verification',
      icon: <ShieldCheck className="w-8 h-8 text-indigo-600" />,
      content: (
        <div className="space-y-6">
          <p className="text-stone-500 text-sm leading-relaxed text-center">
            Verify your identity via phone number to ensure secure restaurant management.
          </p>
          {!isCodeSent ? (
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <Button
                onClick={() => setIsCodeSent(true)}
                disabled={phone.length < 10}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 h-auto"
              >
                Send Verification Code
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <p className="text-xs text-indigo-700 font-medium">Code sent to {phone}</p>
                <button
                  onClick={() => setIsCodeSent(false)}
                  className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Change
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-full aspect-square bg-white border-2 border-stone-100 rounded-xl text-center text-xl font-bold focus:border-indigo-500 focus:outline-none transition-all"
                    onChange={e => {
                      if (e.target.value && i < 3) {
                        (e.target.nextSibling as HTMLInputElement)?.focus();
                      }
                      const chars = verificationCode.split('');
                      chars[i] = e.target.value;
                      const code = chars.join('');
                      setVerificationCode(code);
                      if (code === '1234') {
                        setFormData(prev => ({ ...prev, identityVerified: true }));
                      }
                    }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-stone-400 text-center font-bold uppercase tracking-widest">
                Enter "1234" to verify (demo)
              </p>
              {formData.identityVerified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 py-3 rounded-xl border border-emerald-100"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Phone Verified
                </motion.div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Restaurant Identity',
      icon: <Store className="w-8 h-8 text-[#CC0000]" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Restaurant Name
            </label>
            <input
              type="text"
              placeholder="e.g. The Golden Fork"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              value={formData.restaurantName}
              onChange={e => setFormData({ ...formData, restaurantName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Number of Tables
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="50"
                className="flex-1 accent-[#CC0000]"
                value={formData.tableCount}
                onChange={e => setFormData({ ...formData, tableCount: parseInt(e.target.value) })}
              />
              <span className="font-mono font-bold text-stone-800 w-8 text-center">
                {formData.tableCount}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'AI Persona Design',
      icon: <Sparkles className="w-8 h-8 text-amber-500" />,
      content: (
        <div className="space-y-6">
          <p className="text-stone-500 text-sm">
            Choose how your AI server interacts with guests. This affects tone, suggestions, and surge pricing explanations.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'friendly', label: 'Friendly', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-500', desc: 'Warm & welcoming' },
              { id: 'professional', label: 'Efficient', icon: ShieldCheck, color: 'text-stone-800', bg: 'bg-stone-50', border: 'border-stone-800', desc: 'Fast & precise' },
              { id: 'witty', label: 'Witty', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-600', desc: 'Playful & charming' },
              { id: 'casual', label: 'Casual', icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-600', desc: 'Relaxed & local' },
            ].map(tone => (
              <button
                key={tone.id}
                onClick={() =>
                  setFormData({ ...formData, persona: { ...formData.persona, tone: tone.id } })
                }
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  formData.persona.tone === tone.id
                    ? `${tone.border} ${tone.bg}`
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <tone.icon className={`w-5 h-5 ${tone.color} mb-2`} />
                <p className="font-bold text-sm">{tone.label}</p>
                <p className="text-[10px] text-stone-500">{tone.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Operational Strategy',
      icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-stone-500 text-sm">
            Configure your dynamic pricing strategy. Sliced.ai optimizes margins based on these goals.
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-stone-800">Upsell Intensity</p>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">
                  AI Suggestion Frequency
                </p>
              </div>
              <select
                className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold"
                value={formData.persona.upsellStyle}
                onChange={e =>
                  setFormData({ ...formData, persona: { ...formData.persona, upsellStyle: e.target.value } })
                }
              >
                <option value="suggestive">Suggestive</option>
                <option value="aggressive">Aggressive</option>
                <option value="passive">Passive</option>
              </select>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-stone-800">Dynamic Surge Cap</p>
                <span className="text-xs font-mono font-bold text-[#CC0000]">+25%</span>
              </div>
              <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-[#CC0000]" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready for Launch',
      icon: <QrCode className="w-8 h-8 text-stone-800" />,
      content: (
        <div className="space-y-4 text-center">
          <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100">
            <p className="text-sm text-stone-600 leading-relaxed">
              We&apos;ve generated{' '}
              <span className="font-bold text-stone-800">{formData.tableCount} unique QR codes</span> for your tables.
              Your AI server is trained and ready to upsell.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Live Orders', desc: 'Real-time kitchen feed' },
              { label: 'Pricing Intel', desc: 'AI margin optimization' },
              { label: 'Table Assets', desc: 'QR code management' },
              { label: 'AI Persona', desc: 'Tone & upsell control' },
            ].map((feature, i) => (
              <div key={i} className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-left">
                <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">{feature.label}</p>
                <p className="text-[8px] text-stone-400 font-bold">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const isStepValid = () => {
    if (step === 0) return formData.username.length > 2 && formData.password.length > 5;
    if (step === 1) return formData.identityVerified;
    if (step === 2) return formData.restaurantName.length > 2;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-stone-100 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 apple-red rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-stone-900">Sliced.ai</h1>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Mission Control Setup
                </p>
              </div>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= step ? 'w-4 bg-[#CC0000]' : 'w-2 bg-stone-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-4">
                  {steps[step].icon}
                  <h2 className="text-2xl font-serif font-bold text-stone-900">{steps[step].title}</h2>
                </div>
                {steps[step].content}
              </div>

              <div className="pt-4">
                {step < steps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="w-full py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 group h-auto"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => onComplete(formData)}
                    className="w-full py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 h-auto"
                  >
                    Launch Mission Control
                    <Zap className="w-5 h-5 fill-current" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
