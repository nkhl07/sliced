'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, ChefHat, AlertTriangle, Wifi } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import OrderSidebar from './OrderSidebar';
import Vapi from '@vapi-ai/web';
import { buildVapiAssistantConfig } from '@/lib/ai/vapi-config';

type CallStatus = 'idle' | 'connecting' | 'active' | 'ending';
type SageStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

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
  const [sessionId] = useState(() => uuidv4());
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [sageStatus, setSageStatus] = useState<SageStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [orderVersion, setOrderVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const partialRef = useRef<{ user?: string; assistant?: string }>({});

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const setupVapiListeners = useCallback((vapi: Vapi) => {
    vapi.on('call-start', () => {
      setCallStatus('active');
      setSageStatus('speaking'); // Sage will speak the firstMessage
      setError(null);
    });

    vapi.on('call-end', () => {
      setCallStatus('idle');
      setSageStatus('idle');
      setVolumeLevel(0);
    });

    vapi.on('speech-start', () => {
      setSageStatus('speaking');
    });

    vapi.on('speech-end', () => {
      setSageStatus('listening');
    });

    vapi.on('volume-level', (level: number) => {
      // volume-level is the user's mic level (0-1 range typically)
      setVolumeLevel(Math.min(level * 100, 100));
    });

    vapi.on('message', (message: Record<string, unknown>) => {
      const type = message.type as string;

      // User transcript
      if (type === 'transcript') {
        const role = message.role as string;
        const text = (message.transcript ?? message.message ?? '') as string;
        const isFinal = (message.transcriptType === 'final' || message.isFinal === true);

        if (role === 'user') {
          setSageStatus('thinking');
          if (isFinal && text.trim()) {
            setTranscript(prev => {
              // Replace the last partial user entry if it exists
              const withoutPartial = prev.filter(e => !(e.role === 'user' && !e.isFinal));
              return [...withoutPartial, { id: uuidv4(), role: 'user', text: text.trim(), isFinal: true }];
            });
          } else if (!isFinal && text.trim()) {
            // Show partial transcript
            setTranscript(prev => {
              const withoutPartial = prev.filter(e => !(e.role === 'user' && !e.isFinal));
              return [...withoutPartial, { id: 'user-partial', role: 'user', text: text.trim(), isFinal: false }];
            });
          }
        }
      }

      // Assistant text output (what Sage will say)
      if (type === 'model-output' || (type === 'transcript' && message.role === 'assistant')) {
        const text = (message.output ?? message.transcript ?? message.message ?? '') as string;
        if (text.trim()) {
          setTranscript(prev => {
            const withoutPartial = prev.filter(e => !(e.role === 'assistant' && !e.isFinal));
            return [...withoutPartial, { id: uuidv4(), role: 'assistant', text: text.trim(), isFinal: true }];
          });
          // Refresh order sidebar after any assistant message (item may have been added)
          setOrderVersion(v => v + 1);
        }
      }

      // Conversation updates — refresh order panel
      if (type === 'conversation-update') {
        setOrderVersion(v => v + 1);
      }
    });

    vapi.on('error', (err: unknown) => {
      console.error('[VoiceInterface] Vapi error:', err);
      const message = err instanceof Error ? err.message : 'Voice call failed. Please try again.';
      setError(message);
      setCallStatus('idle');
      setSageStatus('idle');
    });
  }, []);

  const startCall = async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      setError('NEXT_PUBLIC_APP_URL is not set. See setup instructions.');
      return;
    }

    setCallStatus('connecting');
    setError(null);
    setTranscript([]);

    try {
      const vapi = getVapi();
      setupVapiListeners(vapi);
      const config = buildVapiAssistantConfig(sessionId, appUrl);
      await vapi.start(config as Parameters<typeof vapi.start>[0]);
    } catch (err) {
      console.error('[VoiceInterface] Failed to start call:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect. Check your Vapi key.');
      setCallStatus('idle');
    }
  };

  const endCall = () => {
    setCallStatus('ending');
    try {
      getVapi().stop();
    } catch {}
    setOrderVersion(v => v + 1);
  };

  const isActive = callStatus === 'active';
  const isConnecting = callStatus === 'connecting';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Voice area */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-surface/50 backdrop-blur-sm">
          <div className={`w-9 h-9 rounded-full bg-gold/15 border flex items-center justify-center transition-all ${
            sageStatus === 'speaking' ? 'border-gold/60 shadow-[0_0_12px_rgba(201,169,110,0.3)]' : 'border-gold/30'
          }`}>
            <ChefHat size={16} className="text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">Sage</span>
              <StatusDot status={sageStatus} isActive={isActive} />
              <span className="text-xs text-text-secondary capitalize">
                {isConnecting ? 'Connecting…' : isActive ? sageStatus : 'AI Server'}
              </span>
            </div>
            <p className="text-xs text-text-secondary">The Olive Branch · Voice Ordering</p>
          </div>
        </header>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
          {transcript.length === 0 && !isActive && !isConnecting && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-3xl">
                🌿
              </div>
              <div>
                <p className="text-text-primary font-medium">The Olive Branch</p>
                <p className="text-text-secondary text-sm mt-1">Tap the button below to speak with Sage</p>
              </div>
            </div>
          )}

          {transcript.map((entry) => (
            <div
              key={entry.id}
              className={`flex message-enter ${entry.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}
            >
              {entry.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ChefHat size={12} className="text-gold" />
                </div>
              )}
              <div className={`px-4 py-2.5 rounded-2xl max-w-[78%] ${
                entry.role === 'user'
                  ? 'bg-gold/15 border border-gold/20 rounded-tr-sm'
                  : 'card rounded-tl-sm'
              } ${!entry.isFinal ? 'opacity-60 italic' : ''}`}>
                <p className="text-text-primary text-sm leading-relaxed">{entry.text}</p>
              </div>
            </div>
          ))}

          {isActive && sageStatus === 'thinking' && (
            <div className="flex items-start gap-3 message-enter">
              <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <ChefHat size={12} className="text-gold" />
              </div>
              <div className="card px-4 py-3 max-w-[80px] rounded-tl-sm">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot w-1.5 h-1.5 bg-text-secondary rounded-full" />
                  <span className="typing-dot w-1.5 h-1.5 bg-text-secondary rounded-full" />
                  <span className="typing-dot w-1.5 h-1.5 bg-text-secondary rounded-full" />
                </div>
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mb-2 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
          </div>
        )}

        {/* Voice controls */}
        <div className="px-6 pb-8 pt-3 flex flex-col items-center gap-5">
          {/* Waveform visualizer */}
          {isActive && (
            <div className="flex items-end justify-center gap-1 h-10 w-48">
              {Array.from({ length: 12 }).map((_, i) => (
                <WaveBar
                  key={i}
                  index={i}
                  volume={sageStatus === 'speaking' ? 60 : volumeLevel}
                  isActive={sageStatus === 'speaking' || (sageStatus === 'listening' && volumeLevel > 5)}
                />
              ))}
            </div>
          )}

          {/* Main control button */}
          {!isActive && !isConnecting ? (
            <button
              onClick={startCall}
              className="flex items-center gap-3 bg-gold hover:bg-gold-light text-background font-semibold px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-gold/20"
            >
              <Mic size={20} />
              <span>Start Ordering with Sage</span>
            </button>
          ) : isConnecting ? (
            <div className="flex items-center gap-3 bg-surface-2 border border-white/10 text-text-secondary px-8 py-4 rounded-2xl">
              <Wifi size={18} className="animate-pulse" />
              <span className="text-sm">Connecting to Sage…</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Mic mute toggle */}
              <MicToggle vapi={getVapi()} />

              {/* End call */}
              <button
                onClick={endCall}
                className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 border border-red-700/40 text-red-400 font-medium px-6 py-3 rounded-xl transition-all active:scale-95"
              >
                <PhoneOff size={18} />
                <span>End Call</span>
              </button>
            </div>
          )}

          <p className="text-text-secondary/40 text-xs">
            {isActive
              ? sageStatus === 'speaking'
                ? 'Sage is speaking — tap mic to interrupt'
                : 'Speak naturally — Sage is listening'
              : 'Powered by Vapi · Claude claude-3-5-haiku'}
          </p>
        </div>
      </div>

      {/* Order Sidebar */}
      <OrderSidebar sessionId={sessionId} version={orderVersion} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status, isActive }: { status: SageStatus; isActive: boolean }) {
  if (!isActive) return <span className="status-dot bg-text-secondary/30" />;
  if (status === 'speaking') return <span className="status-dot bg-gold animate-pulse" />;
  if (status === 'listening') return <span className="status-dot bg-jade animate-pulse" />;
  if (status === 'thinking') return <span className="status-dot bg-amber animate-pulse" />;
  return <span className="status-dot bg-text-secondary/30" />;
}

function WaveBar({ index, volume, isActive }: { index: number; volume: number; isActive: boolean }) {
  const base = 4;
  const phase = (index / 12) * Math.PI * 2;
  const animated = isActive
    ? base + Math.abs(Math.sin(Date.now() / 300 + phase)) * (volume / 100) * 28
    : base;

  return (
    <div
      className={`w-1.5 rounded-full transition-all duration-100 ${isActive ? 'bg-gold' : 'bg-surface-3'}`}
      style={{ height: `${animated}px`, minHeight: `${base}px` }}
    />
  );
}

function MicToggle({ vapi }: { vapi: Vapi }) {
  const [muted, setMuted] = useState(false);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    vapi.setMuted(next);
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 border font-medium px-5 py-3 rounded-xl transition-all active:scale-95 ${
        muted
          ? 'bg-amber/10 border-amber/30 text-amber'
          : 'bg-surface-2 border-white/10 text-text-secondary hover:border-white/20'
      }`}
    >
      {muted ? <MicOff size={16} /> : <Mic size={16} />}
      <span className="text-sm">{muted ? 'Unmute' : 'Mute'}</span>
    </button>
  );
}
