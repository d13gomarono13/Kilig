import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AgentMode } from '../types/index.js';

interface GeminiClientConfig {
  apiKey?: string;
  authMethod?: string;
  modelName?: string;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(config: GeminiClientConfig) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    console.log(`[DEBUG] Initializing GeminiClient with key starting with: ${apiKey?.substring(0, 8)}...`);
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for GeminiClient');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.modelName || 'gemini-2.5-flash' 
    });
  }

  async execute(prompt: string, mode: AgentMode): Promise<string> {
    try {
      // Here you could customize system instructions based on 'mode'
      // For now, we prepend it to the prompt.
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini execution failed:', error);
      throw error;
    }
  }

  async *streamExecute(prompt: string, mode: AgentMode): AsyncGenerator<string, void, unknown> {
    try {
      const result = await this.model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    } catch (error) {
      console.error('Gemini streaming failed:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Simple generation to check connectivity
      await this.model.generateContent('ping');
      return true;
    } catch (e) {
      console.error('[ERROR] Health check failed:', e);
      return false;
    }
  }
}
