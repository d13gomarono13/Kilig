
import 'dotenv/config';
import { GroqLlm } from '../core/groq-llm.js';

const groqApiKey = process.env.GROQ_API_KEY;
console.log('[Config] Loaded API Key:', groqApiKey ? 'FOUND' : 'MISSING');

export const llmModel = groqApiKey
  ? new GroqLlm({ model: 'groq/llama-3.3-70b-versatile' })
  : 'gemini-2.0-flash';
