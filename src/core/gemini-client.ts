import { GoogleGenAI } from '@google/genai';
import { AgentMode } from '../types/index.js';
import { CacheManager } from '../services/cache/index.js';
import { GroqLlm } from './groq-llm.js';

interface GeminiClientConfig {
  apiKey?: string;
  authMethod?: string; // Kept for compatibility but unused
  modelName?: string;
}

export class GeminiClient {
  private client: GoogleGenAI;
  private groqClient: GroqLlm | null = null;
  private modelName: string;

  constructor(config: GeminiClientConfig) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    
    this.modelName = config.modelName || (groqApiKey ? 'groq/llama-3.3-70b-versatile' : 'gemini-2.0-flash');

    if (this.modelName.startsWith('groq/')) {
      if (!groqApiKey) {
        throw new Error('GROQ_API_KEY is required for Groq models');
      }
      this.groqClient = new GroqLlm({ model: this.modelName, apiKey: groqApiKey });
      // Initialize a dummy genai client to satisfy TS, though we prefer groq
      this.client = new GoogleGenAI({ apiKey: apiKey || 'dummy' });
    } else {
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is required for GeminiClient');
      }
      this.client = new GoogleGenAI({ apiKey });
    }
    
    console.log(`[DEBUG] Initializing GeminiClient (v1) with model: ${this.modelName}`);
  }

  async execute(prompt: string, mode: AgentMode): Promise<string> {
    const cacheKey = CacheManager.generateKey({ model: this.modelName, prompt }, 'gemini:execute');
    
    // Check Cache
    const cached = await CacheManager.get<string>(cacheKey);
    if (cached) {
      console.log(`[GeminiClient] Cache HIT for execute (${cacheKey.substring(0, 8)}...)`);
      return cached;
    }

    try {
      let text = '';
      if (this.groqClient) {
        const generator = this.groqClient.generateContentAsync({
           contents: [{ role: 'user', parts: [{ text: prompt }] }],
           toolsDict: {},
           liveConnectConfig: {}
        }, false);
        const result = await generator.next();
        text = result.value?.content?.parts?.[0]?.text || '';
      } else {
        const result = await this.client.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      
      // Save to Cache
      if (text) {
        await CacheManager.set(cacheKey, text);
      }

      return text;
    } catch (error) {
      console.error(`${this.groqClient ? 'Groq' : 'Gemini'} execution failed:`, error);
      throw error;
    }
  }

  async *streamExecute(prompt: string, mode: AgentMode): AsyncGenerator<string, void, unknown> {
    const cacheKey = CacheManager.generateKey({ model: this.modelName, prompt }, 'gemini:stream');

    // Check Cache
    const cached = await CacheManager.get<string>(cacheKey);
    if (cached) {
      console.log(`[GeminiClient] Cache HIT for streamExecute (${cacheKey.substring(0, 8)}...)`);
      yield cached; // Yield full text as single chunk
      return;
    }

    try {
      let fullText = '';
      
      if (this.groqClient) {
        const generator = this.groqClient.generateContentAsync({
           contents: [{ role: 'user', parts: [{ text: prompt }] }],
           toolsDict: {},
           liveConnectConfig: {}
        }, true);
        
        for await (const chunk of generator) {
           const text = chunk.content?.parts?.[0]?.text;
           if (text) {
             fullText += text;
             yield text;
           }
        }
      } else {
        const result = await this.client.models.generateContentStream({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        for await (const chunk of result.stream) {
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullText += text;
            yield text;
          }
        }
      }

      // Save complete response to cache
      if (fullText) {
        await CacheManager.set(cacheKey, fullText);
      }

    } catch (error) {
      console.error(`${this.groqClient ? 'Groq' : 'Gemini'} streaming failed:`, error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      if (this.groqClient) {
        const generator = this.groqClient.generateContentAsync({
           contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
           toolsDict: {},
           liveConnectConfig: {}
        }, false);
        await generator.next();
        return true;
      } else {
        await this.client.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
        });
        return true;
      }
    } catch (e) {
      console.error('[ERROR] Health check failed:', e);
      return false;
    }
  }
}