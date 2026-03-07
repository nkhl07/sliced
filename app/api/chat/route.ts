// app/api/chat/route.ts
// The core AI endpoint — streams Sage's responses with tool execution

import { streamText, convertToModelMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { createTools } from '@/lib/ai/tools';

export const maxDuration = 60; // Allow up to 60s for complex multi-step tool calls

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();

  if (!sessionId) {
    return new Response('sessionId required', { status: 400 });
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: createTools(sessionId),
    temperature: 0.7,
    onError: ({ error }) => {
      console.error('[chat/route] streamText error:', error);
    },
  });

  return result.toUIMessageStreamResponse();
}
