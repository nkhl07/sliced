import type { Metadata } from 'next';
import VoiceInterface from '@/components/chat/VoiceInterface';

export const metadata: Metadata = {
  title: 'Order · The Olive Branch',
  description: 'Voice-powered ordering with Sage, your AI server.',
};

export default function OrderingPage() {
  return <VoiceInterface />;
}
