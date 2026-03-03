// lib/ai/tools.ts
// Vercel AI SDK tool wrappers for the text-chat endpoint (/api/chat).
// Business logic lives in tool-handlers.ts and is also used by the Vapi webhook.

import { tool } from 'ai';
import { z } from 'zod';
import {
  handleSearchMenu,
  handleCheckInventory,
  handleGetDynamicPrice,
  handleAddToOrder,
  handleGetOrderSummary,
  handleGetRecommendations,
  handleFinalizeOrder,
} from './tool-handlers';

export function createTools(sessionId: string) {
  return {

    searchMenu: tool({
      description: 'Search and browse menu items. Use this to answer any question about what dishes are available, their descriptions, dietary info, or pricing. Always use this before making recommendations.',
      parameters: z.object({
        query: z.string().optional().describe('Text search in name or description'),
        category: z.enum(['starter', 'main', 'side', 'dessert', 'drink']).optional(),
        isVegan: z.boolean().optional(),
        isVegetarian: z.boolean().optional(),
        isHalal: z.boolean().optional(),
        isKosher: z.boolean().optional(),
        isGlutenFree: z.boolean().optional(),
        excludeAllergen: z.string().optional().describe('Exclude items containing this allergen'),
        sortByMargin: z.boolean().optional().describe('Sort by profit margin'),
      }),
      execute: async (params) => handleSearchMenu(params),
    }),

    checkInventory: tool({
      description: 'Check the real-time availability and stock level for a specific menu item by its ID.',
      parameters: z.object({
        menuItemId: z.number().describe('The ID of the menu item to check'),
      }),
      execute: async (params) => handleCheckInventory(params),
    }),

    getDynamicPrice: tool({
      description: 'Get the current dynamic price for a menu item. Always call this before quoting a price to a guest.',
      parameters: z.object({
        menuItemId: z.number().describe('The ID of the menu item'),
      }),
      execute: async (params) => handleGetDynamicPrice(params),
    }),

    addToOrder: tool({
      description: "Add a menu item to the guest's order after they have explicitly confirmed they want it.",
      parameters: z.object({
        menuItemId: z.number().describe('The ID of the menu item to add'),
        quantity: z.number().min(1).max(10).default(1),
        specialInstructions: z.string().optional().describe('Any modifications or special requests'),
      }),
      execute: async (params) => handleAddToOrder({ ...params, sessionId }),
    }),

    getOrderSummary: tool({
      description: 'Get the current order summary for this session.',
      parameters: z.object({}),
      execute: async () => handleGetOrderSummary({ sessionId }),
    }),

    getRecommendations: tool({
      description: 'Get personalized upsell and pairing recommendations based on the current order.',
      parameters: z.object({
        context: z.string().optional().describe('Any relevant context about guest preferences'),
        focusCategory: z.enum(['side', 'drink', 'dessert', 'starter']).optional(),
      }),
      execute: async (params) => handleGetRecommendations({ ...params, sessionId }),
    }),

    finalizeOrder: tool({
      description: "Finalize and submit the guest's order to the kitchen. Only call when guest explicitly says they're done.",
      parameters: z.object({
        tableNumber: z.number().optional(),
        notes: z.string().optional(),
      }),
      execute: async (params) => handleFinalizeOrder({ ...params, sessionId }),
    }),

  };
}
