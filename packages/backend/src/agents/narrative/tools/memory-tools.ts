/**
 * Memory Integration Tools for Narrative Agent
 * 
 * These tools load relevant memories (past Validator rejections, user preferences)
 * before generating comic manifests, and save new learnings after validation.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { memoryService, MemorySearchResult } from '../../../services/memory/mem0-service.js';

/**
 * Tool to load relevant memories before generating a manifest
 */
export const loadContextMemoriesTool = new FunctionTool({
    name: 'load_context_memories',
    description: 'Load relevant memories and past learnings for the current user. Call this FIRST before generating a manifest to avoid repeating past mistakes.',
    parameters: z.object({
        userId: z.string().describe('The user ID to load memories for'),
        query: z.string().describe('The current task or topic to find relevant memories for')
    }),
    execute: async ({ userId, query }: { userId: string; query: string }) => {
        try {
            const results = await memoryService.searchMemories(userId, query, 5);

            if (results.length === 0) {
                return JSON.stringify({
                    success: true,
                    memories: [],
                    message: 'No relevant memories found. Proceed with fresh context.'
                });
            }

            const formattedMemories = results.map((r: MemorySearchResult) => ({
                content: r.memory.content,
                type: r.memory.metadata?.type || 'general',
                relevance: r.score.toFixed(2)
            }));

            return JSON.stringify({
                success: true,
                memories: formattedMemories,
                message: `Found ${results.length} relevant memories. Consider these learnings when generating output.`
            });
        } catch (error: any) {
            console.error('[MemoryTool] Error loading memories:', error);
            return JSON.stringify({ success: false, memories: [], message: error.message });
        }
    }
});

/**
 * Tool to save a learning from Validator feedback
 */
export const saveValidatorLearningTool = new FunctionTool({
    name: 'save_validator_learning',
    description: 'Save a learning from Validator rejection feedback. Call this when the Validator rejects your output so you can improve in the future.',
    parameters: z.object({
        userId: z.string().describe('The user ID to save the learning for'),
        learning: z.string().describe('The lesson learned from validation feedback'),
        context: z.string().describe('The context or topic this learning applies to')
    }),
    execute: async ({ userId, learning, context }: { userId: string; learning: string; context: string }) => {
        try {
            const memoryId = await memoryService.addMemory(userId, learning, {
                type: 'validator_learning',
                context,
                source: 'narrative_agent'
            });

            return JSON.stringify({
                success: true,
                memoryId,
                message: `Learning saved! Will be used in future manifest generations.`
            });
        } catch (error: any) {
            console.error('[MemoryTool] Error saving learning:', error);
            return JSON.stringify({ success: false, message: error.message });
        }
    }
});

/**
 * Tool to save user preferences
 */
export const saveUserPreferenceTool = new FunctionTool({
    name: 'save_user_preference',
    description: 'Save a user preference for future sessions (e.g., "User prefers concise explanations").',
    parameters: z.object({
        userId: z.string().describe('The user ID'),
        preference: z.string().describe('The preference to save')
    }),
    execute: async ({ userId, preference }: { userId: string; preference: string }) => {
        try {
            const memoryId = await memoryService.addMemory(userId, preference, {
                type: 'user_preference',
                source: 'agent_learned'
            });

            return JSON.stringify({
                success: true,
                memoryId,
                message: `Preference saved!`
            });
        } catch (error: any) {
            console.error('[MemoryTool] Error saving preference:', error);
            return JSON.stringify({ success: false, message: error.message });
        }
    }
});
