// lib/ai/vapi-config.ts
// Vapi assistant configuration — inline config passed to vapi.start()
// Tools use server-side execution (Vapi POSTs to our /api/vapi/tools webhook)

// Matches the tone IDs used in the owner PersonaSetup panel
export type PersonalityType = 'friendly' | 'professional' | 'casual' | 'witty';

// Voice IDs from https://play.cartesia.ai/voices — replace with any you prefer
export const VOICE_OPTIONS = [
  { id: '79a125e8-cd45-4c13-8a67-188112f4dd22', label: 'Sophia', description: 'British Female' },
  { id: 'a0e99841-438c-4a64-b679-ae501e7d6091', label: 'James',  description: 'American Male'  },
  { id: 'b7d50908-b17c-442d-ad8d-810c63997ed9', label: 'Luna',   description: 'Casual Female'  },
] as const;

const PERSONALITY_PROMPTS: Record<PersonalityType, string> = {
  friendly:     'PERSONALITY: Think of yourself as a trusted friend who knows this menu inside out. Warm, welcoming, and enthusiastic.',
  professional: 'PERSONALITY: You are refined and elegant, like a Michelin-starred maître d\'. Polished and precise at all times.',
  casual:       'PERSONALITY: Keep it relaxed and easy-going, like chatting with a local regular who knows all the good stuff.',
  witty:        'PERSONALITY: Be playful, charming, and clever. Light humour is welcome — make the experience delightful.',
};

export function buildVapiAssistantConfig(
  sessionId: string,
  appUrl: string,
  voiceId: string = VOICE_OPTIONS[0].id,
  personality: PersonalityType = 'warm',
) {
  const toolServerUrl = `${appUrl}/api/vapi/tools`;

  // Voice-optimized system prompt — shorter and conversational vs. the text version
  const systemPrompt = `You are Sage, the AI server at The Olive Branch — a fine Mediterranean restaurant. You are warm, knowledgeable, and speak in a natural, conversational tone.

CRITICAL VOICE RULES:
- Keep all responses SHORT — 1-3 sentences maximum for simple things, slightly longer for descriptions.
- NO bullet points, NO markdown, NO numbered lists. Speak in natural flowing sentences.
- Say prices as "twelve dollars" or "twenty-eight fifty", not "$12" or "$28.50".
- When you add something to the order, confirm it clearly: "Perfect, I've added the salmon."
- When unsure about availability, always check first.

YOUR TOOLS (only call when you actually need live data — skip for pure conversation):
- searchMenu: when guest asks what's available or wants options by category/diet
- checkInventory: before confirming an item is available
- getDynamicPrice: when quoting a price
- addToOrder: when guest explicitly confirms they want an item
- getOrderSummary: when guest asks what's in their order
- getRecommendations: when suggesting pairings
- finalizeOrder: when guest says they're done and ready to order

SESSION ID for all order tools: ${sessionId}

DIETARY: Always ask about restrictions at the start. Remember Halal and allergen requirements throughout.

FLOW: Greet → ask about dietary needs → help them find dishes → suggest pairings → confirm and finalize.

${PERSONALITY_PROMPTS[personality]}`;

  // Tool definitions in OpenAI function-calling format, with server URL for execution
  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'searchMenu',
        description: 'Search menu items by category, dietary filters, or text query.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Text to search in dish names or descriptions' },
            category: { type: 'string', enum: ['starter', 'main', 'side', 'dessert', 'drink'] },
            isVegan: { type: 'boolean' },
            isVegetarian: { type: 'boolean' },
            isHalal: { type: 'boolean' },
            isKosher: { type: 'boolean' },
            isGlutenFree: { type: 'boolean' },
            excludeAllergen: { type: 'string', description: 'Allergen to exclude (e.g. nuts, dairy, gluten)' },
          },
        },
      },
      server: { url: toolServerUrl },
    },
    {
      type: 'function' as const,
      function: {
        name: 'checkInventory',
        description: 'Check if a specific menu item is in stock.',
        parameters: {
          type: 'object',
          properties: {
            menuItemId: { type: 'number', description: 'The numeric ID of the menu item' },
          },
          required: ['menuItemId'],
        },
      },
      server: { url: toolServerUrl },
    },
    {
      type: 'function' as const,
      function: {
        name: 'getDynamicPrice',
        description: 'Get the current price for a menu item (may differ from the base price due to demand or inventory).',
        parameters: {
          type: 'object',
          properties: {
            menuItemId: { type: 'number' },
          },
          required: ['menuItemId'],
        },
      },
      server: { url: toolServerUrl },
    },
    {
      type: 'function' as const,
      function: {
        name: 'addToOrder',
        description: "Add an item to the guest's order. Only call after the guest explicitly confirms they want it.",
        parameters: {
          type: 'object',
          properties: {
            menuItemId: { type: 'number' },
            quantity: { type: 'number', default: 1 },
            specialInstructions: { type: 'string' },
          },
          required: ['menuItemId'],
        },
      },
      server: { url: toolServerUrl },
    },
    {
      type: 'function' as const,
      function: {
        name: 'getOrderSummary',
        description: "Read back what's in the current order.",
        parameters: { type: 'object', properties: {} },
      },
      server: { url: toolServerUrl },
    },
    {
      type: 'function' as const,
      function: {
        name: 'getRecommendations',
        description: 'Get pairing or upsell suggestions based on what is already in the order.',
        parameters: {
          type: 'object',
          properties: {
            focusCategory: { type: 'string', enum: ['side', 'drink', 'dessert', 'starter'] },
          },
        },
      },
      server: { url: toolServerUrl },
    },
    {
      type: 'function' as const,
      function: {
        name: 'finalizeOrder',
        description: "Submit the order to the kitchen. Only call when the guest explicitly says they are ready and done.",
        parameters: {
          type: 'object',
          properties: {
            tableNumber: { type: 'number' },
            notes: { type: 'string' },
          },
        },
      },
      server: { url: toolServerUrl },
    },
  ];

  return {
    name: 'Sage',
    firstMessage: "Welcome to The Olive Branch! I'm Sage, your server this evening. Before we look at the menu, do you have any dietary preferences or allergies I should know about?",
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en-US',
    },
    model: {
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022', // Haiku for voice: faster latency than Sonnet
      messages: [{ role: 'system' as const, content: systemPrompt }],
      tools,
      temperature: 0.7,
      maxTokens: 300, // Keep voice responses concise
    },
    voice: {
      provider: 'cartesia',
      voiceId,
    },
    endCallFunctionEnabled: false,
    recordingEnabled: false,
  };
}
