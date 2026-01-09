import 'dotenv/config';
import { ResilientLlm } from '../core/resilient-llm.js';

/**
 * LLM Configuration for Kilig Pipeline
 * 
 * Uses OpenRouter free-tier models with automatic failover.
 * If OPENROUTER_API_KEY is not set, falls back to Gemini.
 * 
 * Free Model Stack (priority order):
 * 1. Gemma 3 27B - Fast, 128k context, great for orchestration
 * 2. DeepSeek R1 - Best reasoning (comparable to o1)
 * 3. Llama 3.3 70B - Large, reliable fallback
 * 4. Qwen 2.5 Coder 32B - Best for JSON/code generation
 * 5. Llama 4 Maverick - Newest, experimental
 * 
 * Effective capacity: 250+ requests/day across all models
 */

const apiKey = process.env.OPENROUTER_API_KEY;

// Optimal free model stack for Kilig's multi-agent pipeline
export const FREE_MODEL_STACK = [
    'google/gemma-3-27b-it:free',           // Primary: Fast, 128k context
    'deepseek/deepseek-r1:free',             // Backup 1: Best reasoning
    'meta-llama/llama-3.3-70b-instruct:free', // Backup 2: Large, reliable
    'qwen/qwen-2.5-coder-32b-instruct:free',  // Backup 3: Code/JSON specialist
    'meta-llama/llama-4-maverick:free'        // Backup 4: Newest model
];

/**
 * The main LLM instance used by all agents.
 * 
 * - If OPENROUTER_API_KEY is set: Uses ResilientLlm with multi-model rotation
 * - Otherwise: Falls back to Gemini 2.0 Flash
 */
export const llmModel = apiKey
    ? new ResilientLlm({ models: FREE_MODEL_STACK, apiKey })
    : 'gemini-2.0-flash';

// Log which mode we're using
if (apiKey) {
    console.log('[Config] Using ResilientLlm with OpenRouter free models');
    console.log('[Config] Model stack:', FREE_MODEL_STACK.map(m => m.split('/')[1]?.split(':')[0]).join(' → '));
} else {
    console.log('[Config] Using Gemini 2.0 Flash (set OPENROUTER_API_KEY for free multi-model)');
}
