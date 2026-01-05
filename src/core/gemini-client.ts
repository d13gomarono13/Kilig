import { GoogleGenAI } from '@google/genai';
import { AgentMode } from '../types/index.js';

interface GeminiClientConfig {
  apiKey?: string;
  authMethod?: string; // Kept for compatibility but unused
  modelName?: string;
}

export class GeminiClient {
  private client: GoogleGenAI;
  private modelName: string;

  constructor(config: GeminiClientConfig) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    console.log(`[DEBUG] Initializing GeminiClient (v1) with key starting with: ${apiKey?.substring(0, 8)}...`);
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for GeminiClient');
    }
    this.client = new GoogleGenAI({ apiKey });
    this.modelName = config.modelName || 'gemini-2.0-flash';
  }

  async execute(prompt: string, mode: AgentMode): Promise<string> {
    try {
      const result = await this.client.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      return result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini execution failed:', error);
      throw error;
    }
  }

  async *streamExecute(prompt: string, mode: AgentMode): AsyncGenerator<string, void, unknown> {
    try {
      const result = await this.client.models.generateContentStream({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      for await (const chunk of result.stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error('Gemini streaming failed:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
      });
      return true;
    } catch (e) {
      console.error('[ERROR] Health check failed:', e);
      return false;
    }
  }
}