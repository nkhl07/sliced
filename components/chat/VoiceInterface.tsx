'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, ChefHat, AlertTriangle, Wifi, Keyboard, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import { v4 as uuidv4 } from 'uuid';
import OrderSidebar from './OrderSidebar';
import Vapi from '@vapi-ai/web';
import { buildVapiAssistantConfig, VOICE_OPTIONS, PersonalityType } from '@/lib/ai/vapi-config';
// VOICE_OPTIONS used for default voiceId fallback
import { PERSONA_STORAGE_KEY } from '@/components/Owner/PersonaSetup';

type CallStatus = 'idle' | 'connecting' | 'active' | 'ending';
type SageStatus = 'idle' | 'listening' | 'thinking' | 'speaking';
type InputMode = 'voice' | 'text';

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isFinal: boolean;
}

let vapiInstance: Vapi | null = null;

function getVapi(): Vapi {
  if (!vapiInstance) {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) throw new Error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set');
    vapiInstance = new Vapi(key);
  }
  return vapiInstance;
}

export default function VoiceInterface() {
  const [sessionId, setSessionId] = useState('');
  useEffect(() => { setSessionId(uuidv4()); }, []);
  const [inputMode, setInputMode] = useState<InputMode>('voice');

  // Voice settings — configured by restaurant in owner portal, not by guest
  const [voiceId, setVoiceId] = useState<string>(VOICE_OPTIONS[0].id);
  const [personality, setPersonality] = useState<PersonalityType>('friendly');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSONA_STORAGE_KEY);
      if (saved) {
        const { voiceId: v, tone } = JSON.parse(saved);
        if (v) setVoiceId(v);
        if (tone) setPersonality(tone as PersonalityType);
      }
    } catch {}
  }, []);

  // Voice state
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [sageStatus, setSageStatus] = useState<SageStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Text state
  const [inputText, setInputText] = useState('');
  const { messages: chatMessages, sendMessage, status: chatStatus } = useChat({
    api: '/api/chat',
    body: { sessionId },
    onFinish: () => setOrderVersion(v => v + 1),
  });
  const isChatLoading = chatStatus === 'submitted' || chatStatus === 'streaming';

  const [orderVersion, setOrderVersion] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const greetingTriggeredRef = useRef(false);
  const lastAssistantTextRef = useRef('');
  const lastCommittedAssistantTextRef = useRef('');
  const userTranscriptRef = useRef('');

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, chatMessages]);

  // Auto-greet when text mode becomes active
  useEffect(() => {
    if (inputMode === 'text' && sessionId && !greetingTriggeredRef.current) {
      greetingTriggeredRef.current = true;
      setTimeout(() => sendMessage({ text: '__greeting__' }, { body: { sessionId } }), 400);
    }
  }, [inputMode, sessionId]);

  useEffect(() => {
    if (inputMode === 'text') {
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, [inputMode]);

  const setupVapiListeners = useCallback((vapi: Vapi) => {
    vapi.on('call-start', () => { setCallStatus('active'); setSageStatus('speaking'); setVoiceError(null); lastAssistantTextRef.current = ''; lastCommittedAssistantTextRef.current = ''; });
    vapi.on('call-end', () => { setCallStatus('idle'); setSageStatus('idle'); setVolumeLevel(0); });
    vapi.on('speech-start', () => {
      setSageStatus('speaking');
      userTranscriptRef.current = '';
      setTranscript(prev => prev.map(e =>
        e.id === 'user-current' ? { ...e, id: uuidv4(), isFinal: true } : e
      ));
    });
    vapi.on('speech-end', () => {
      setSageStatus('listening');
      const full = lastAssistantTextRef.current;
      setTranscript(prev => prev.map(e =>
        e.id === 'assistant-speaking' ? { ...e, id: uuidv4(), isFinal: true } : e
      ));
      if (full) {
        lastCommittedAssistantTextRef.current = full;
        lastAssistantTextRef.current = '';
      }
    });
    vapi.on('volume-level', (level: number) => setVolumeLevel(Math.min(level * 100, 100)));

    vapi.on('message', (message: Record<string, unknown>) => {
      const type = message.type as string;

      if (type === 'transcript') {
        const role = message.role as string;
        const text = (message.transcript ?? message.message ?? '') as string;
        const isFinal = message.transcriptType === 'final' || message.isFinal === true;

        if (role === 'user' && text.trim()) {
          setSageStatus('thinking');
          lastCommittedAssistantTextRef.current = '';
          if (isFinal) {
            userTranscriptRef.current = (userTranscriptRef.current + ' ' + text.trim()).trim();
          }
          const display = isFinal
            ? userTranscriptRef.current
            : (userTranscriptRef.current + ' ' + text.trim()).trim();
          setTranscript(prev => {
            const without = prev.filter(e => e.id !== 'user-current');
            return [...without, { id: 'user-current', role: 'user', text: display, isFinal: false }];
          });
        }
      }

      if (type === 'conversation-update') {
        setOrderVersion(v => v + 1);
        const conversation = message.conversation as Array<{ role: string; content: unknown }> | undefined;
        if (conversation?.length) {
          const lastMsg = conversation[conversation.length - 1];
          if (lastMsg.role === 'assistant') {
            const c = lastMsg.content;
            const full = typeof c === 'string'
              ? c
              : Array.isArray(c) ? (c as any[]).map(x => x.text ?? '').join('') : '';
            lastAssistantTextRef.current = full;
            const newText = lastCommittedAssistantTextRef.current
              ? full.slice(lastCommittedAssistantTextRef.current.length).trim()
              : full.trim();
            if (newText) {
              setTranscript(prev => {
                const without = prev.filter(e => e.id !== 'assistant-speaking');
                return [...without, { id: 'assistant-speaking', role: 'assistant', text: newText, isFinal: false }];
              });
            }
          }
        }
      }
    });

    vapi.on('error', (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Voice call failed. Please try again.';
      setVoiceError(msg);
      setCallStatus('idle');
      setSageStatus('idle');
    });
  }, []);

  const startCall = async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) { setVoiceError('NEXT_PUBLIC_APP_URL is not set. See setup instructions.'); return; }
    setCallStatus('connecting');
    setVoiceError(null);
    setTranscript([]);
    try {
      const vapi = getVapi();
      vapi.removeAllListeners();
      setupVapiListeners(vapi);
      const config = buildVapiAssistantConfig(sessionId, appUrl, voiceId, personality);
      await vapi.start(config as Parameters<typeof vapi.start>[0]);
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : 'Failed to connect. Check your Vapi key.');
      setCallStatus('idle');
    }
  };

  const endCall = () => {
    setCallStatus('ending');
    try { getVapi().stop(); } catch {}
    setOrderVersion(v => v + 1);
  };

  const handleSend = () => {
    if (!inputText.trim() || isChatLoading || !sessionId) return;
    sendMessage({ text: inputText }, { body: { sessionId } });
    setInputText('');
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isActive = callStatus === 'active';
  const isConnecting = callStatus === 'connecting';

  const statusLabel = isConnecting ? 'Connecting…' : isActive ? sageStatus : inputMode === 'text' ? 'Text Mode' : 'AI Server';
  const statusColor =
    !isActive && inputMode !== 'text' ? 'bg-stone-300'
    : inputMode === 'text' ? 'bg-stone-400'
    : sageStatus === 'speaking' ? 'bg-gold'
    : sageStatus === 'listening' ? 'bg-emerald-500'
    : 'bg-amber-400';

  const visibleMessages = inputMode === 'text'
    ? chatMessages.filter(m => m.role === 'user' || m.role === 'assistant')
    : transcript;

  const isEmpty = visibleMessages.length === 0 && !isActive && !isConnecting;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFCF8]">
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between px-8 py-5 border-b border-stone-100 bg-white/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gold/10 border flex items-center justify-center transition-all ${
              sageStatus === 'speaking' ? 'border-gold/50 shadow-lg shadow-gold/20' : 'border-gold/25'
            }`}>
              <ChefHat size={18} className="text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-stone-900 text-lg leading-none">Sage</span>
                <span className={`w-2 h-2 rounded-full ${statusColor} ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-xs text-stone-400 capitalize">{statusLabel}</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">The Olive Branch · Voice Ordering</p>
            </div>
          </div>

          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Session
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Transcript / Chat */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3">
          <AnimatePresence>
            {isEmpty && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center h-full text-center gap-4 py-16"
              >
                <div className="w-20 h-20 rounded-[24px] bg-white border border-stone-100 shadow-sm flex items-center justify-center text-4xl">
                  🌿
                </div>
                <div>
                  <p className="font-serif font-black text-stone-900 text-xl">The Olive Branch</p>
                  <p className="text-stone-500 text-sm mt-1">
                    {inputMode === 'text' ? 'Type a message below to chat with Sage' : 'Tap the button below to speak with Sage'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice transcript */}
          {inputMode === 'voice' && transcript.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${entry.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}
            >
              {entry.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ChefHat size={13} className="text-gold" />
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-[78%] shadow-sm ${
                entry.role === 'user'
                  ? 'bg-stone-100 border border-stone-200 rounded-tr-sm'
                  : 'bg-white border border-stone-100 rounded-tl-sm'
              } ${!entry.isFinal ? 'opacity-60 italic' : ''}`}>
                <p className="text-stone-900 text-sm leading-relaxed">{entry.text}</p>
              </div>
            </motion.div>
          ))}

          {/* Text chat messages */}
          {inputMode === 'text' && chatMessages.filter(m => {
            if (m.role !== 'user' && m.role !== 'assistant') return false;
            if (m.role === 'user') {
              const text = m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || (m as any).content || '';
              if (text === '__greeting__') return false;
            }
            return true;
          }).map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ChefHat size={13} className="text-gold" />
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-[78%] shadow-sm ${
                msg.role === 'user'
                  ? 'bg-stone-100 border border-stone-200 rounded-tr-sm'
                  : 'bg-white border border-stone-100 rounded-tl-sm'
              }`}>
                <p className="text-stone-900 text-sm leading-relaxed">
                  {msg.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || (msg as any).content}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Thinking indicators */}
          <AnimatePresence>
            {isActive && sageStatus === 'thinking' && (
              <motion.div key="voice-thinking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                  <ChefHat size={13} className="text-gold" />
                </div>
                <div className="bg-white border border-stone-100 shadow-sm px-4 py-3 max-w-[80px] rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="typing-dot w-1.5 h-1.5 bg-stone-400 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-stone-400 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
            {inputMode === 'text' && isChatLoading && (
              <motion.div key="text-thinking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                  <ChefHat size={13} className="text-gold" />
                </div>
                <div className="bg-white border border-stone-100 shadow-sm px-4 py-3 max-w-[80px] rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="typing-dot w-1.5 h-1.5 bg-stone-400 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-stone-400 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={transcriptEndRef} />
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="mx-8 mb-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3"
            >
              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-600 text-sm flex-1">{voiceError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="px-8 pb-8 pt-3 flex flex-col items-center gap-4"
        >
          {/* Waveform */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }}
                className="flex items-end justify-center gap-1 h-10 w-48"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <WaveBar key={i} index={i} volume={sageStatus === 'speaking' ? 60 : volumeLevel} isActive={sageStatus === 'speaking' || (sageStatus === 'listening' && volumeLevel > 5)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* Active voice call controls */}
            {isActive || isConnecting ? (
              <motion.div key="voice-active" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                {isConnecting ? (
                  <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 text-stone-500 px-8 py-4 rounded-2xl">
                    <Wifi size={18} className="animate-pulse" />
                    <span className="text-sm font-medium">Connecting to Sage…</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <MicToggle vapi={getVapi()} />
                    <button onClick={endCall} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold px-6 py-3 rounded-xl transition-colors active:scale-95">
                      <PhoneOff size={18} />
                      <span>End Call</span>
                    </button>
                  </div>
                )}
              </motion.div>

            ) : inputMode === 'text' ? (
              /* Text input mode */
              <motion.div key="text-input" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-3">
                  {/* Switch to voice button */}
                  <button
                    type="button"
                    onClick={() => setInputMode('voice')}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-stone-50 border border-stone-200 text-stone-400 hover:text-stone-700 hover:border-stone-400 rounded-xl transition-all"
                    title="Switch to voice"
                  >
                    <Mic size={18} />
                  </button>

                  {/* Text area */}
                  <div className="flex-1 flex items-end gap-2 bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-stone-400 transition-colors">
                    <textarea
                      ref={textInputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleTextKeyDown}
                      placeholder="Type your order or ask a question…"
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-stone-900 text-sm placeholder-stone-400 focus:outline-none leading-relaxed"
                      style={{ maxHeight: '120px' }}
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isChatLoading}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-stone-900 text-white rounded-lg disabled:opacity-30 hover:bg-stone-700 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>
                <p className="text-stone-400 text-xs text-center mt-3">Press Enter to send · Shift+Enter for new line</p>
              </motion.div>

            ) : (
              /* Idle voice mode */
              <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center gap-3">
                <button
                  onClick={startCall}
                  className="flex items-center gap-3 bg-stone-900 hover:bg-stone-800 text-white font-bold px-8 py-4 rounded-2xl transition-colors active:scale-95 shadow-lg shadow-stone-900/20"
                >
                  <Mic size={20} />
                  <span>Start Ordering with Sage</span>
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className="w-14 h-14 flex items-center justify-center bg-white border border-stone-200 text-stone-400 hover:text-stone-700 hover:border-stone-400 rounded-2xl transition-all shadow-sm"
                  title="Type instead"
                >
                  <Keyboard size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-stone-400 text-xs">
            {isActive
              ? sageStatus === 'speaking' ? 'Sage is speaking — tap mic to interrupt' : 'Speak naturally — Sage is listening'
              : inputMode === 'text' ? 'Powered by Claude · Text chat with Sage'
              : 'Powered by Vapi · Claude claude-3-5-haiku'}
          </p>
        </motion.div>
      </div>

      <OrderSidebar sessionId={sessionId} version={orderVersion} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WaveBar({ index, volume, isActive }: { index: number; volume: number; isActive: boolean }) {
  const base = 4;
  const phase = (index / 12) * Math.PI * 2;
  const animated = isActive
    ? base + Math.abs(Math.sin(Date.now() / 300 + phase)) * (volume / 100) * 28
    : base;

  return (
    <div
      className={`w-1.5 rounded-full transition-all duration-100 ${isActive ? 'bg-gold' : 'bg-stone-200'}`}
      style={{ height: `${animated}px`, minHeight: `${base}px` }}
    />
  );
}

function MicToggle({ vapi }: { vapi: Vapi }) {
  const [muted, setMuted] = useState(false);
  const toggle = () => { const next = !muted; setMuted(next); vapi.setMuted(next); };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 border font-bold px-5 py-3 rounded-xl transition-colors active:scale-95 ${
        muted ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
      }`}
    >
      {muted ? <MicOff size={16} /> : <Mic size={16} />}
      <span className="text-sm">{muted ? 'Unmute' : 'Mute'}</span>
    </button>
  );
}
