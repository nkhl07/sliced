// app/api/vapi/tools/route.ts
// Vapi server-side tool execution webhook.
// Vapi calls this endpoint when the AI wants to execute a tool.
// We run the tool against our DB and return the result.
//
// Request format (from Vapi):
//   POST { message: { type: "tool-calls", toolCallList: [...], call: { metadata: { sessionId } } } }
//
// Response format (to Vapi):
//   { results: [{ toolCallId: string, result: string }] }

import { NextResponse } from 'next/server';
import {
  handleSearchMenu,
  handleCheckInventory,
  handleGetDynamicPrice,
  handleAddToOrder,
  handleGetOrderSummary,
  handleGetRecommendations,
  handleFinalizeOrder,
} from '@/lib/ai/tool-handlers';

interface VapiToolCall {
  id?: string;
  toolCall?: {
    id: string;
    function?: {
      name: string;
      arguments?: string | Record<string, unknown>;
    };
  };
  // Vapi sometimes uses a flat structure
  function?: {
    name: string;
    arguments?: string | Record<string, unknown>;
  };
}

interface VapiWebhookBody {
  message: {
    type: string;
    toolCallList?: VapiToolCall[];
    call?: {
      metadata?: { sessionId?: string };
    };
  };
}

export async function POST(req: Request) {
  // Verify the webhook secret if configured
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = req.headers.get('x-vapi-secret');
    if (authHeader !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: VapiWebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message } = body;

  // Only process tool-calls events
  if (message?.type !== 'tool-calls') {
    return NextResponse.json({});
  }

  const sessionId = message.call?.metadata?.sessionId ?? 'unknown';
  const toolCalls = message.toolCallList ?? [];

  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      // Handle both Vapi message structures
      const toolCallId = tc.toolCall?.id ?? tc.id ?? 'unknown';
      const fnName = tc.toolCall?.function?.name ?? tc.function?.name ?? '';
      const rawArgs = tc.toolCall?.function?.arguments ?? tc.function?.arguments ?? {};
      const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;

      let result: unknown;

      try {
        switch (fnName) {
          case 'searchMenu':
            result = await handleSearchMenu(args);
            break;
          case 'checkInventory':
            result = await handleCheckInventory(args);
            break;
          case 'getDynamicPrice':
            result = await handleGetDynamicPrice(args);
            break;
          case 'addToOrder':
            result = await handleAddToOrder({ ...args, sessionId });
            break;
          case 'getOrderSummary':
            result = await handleGetOrderSummary({ sessionId });
            break;
          case 'getRecommendations':
            result = await handleGetRecommendations({ ...args, sessionId });
            break;
          case 'finalizeOrder':
            result = await handleFinalizeOrder({ ...args, sessionId });
            break;
          default:
            result = { error: `Unknown tool: ${fnName}` };
        }
      } catch (err) {
        console.error(`[vapi/tools] Error executing ${fnName}:`, err);
        result = { error: 'Tool execution failed' };
      }

      return {
        toolCallId,
        result: JSON.stringify(result),
      };
    })
  );

  return NextResponse.json({ results });
}
