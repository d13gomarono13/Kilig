import fs from 'fs/promises';
import { AgentMode } from '../types/index.js';

export class MemoryManager {
  private memoryPath: string;
  private memory: Record<string, any> = {};

  constructor(memoryPath: string) {
    this.memoryPath = memoryPath;
  }

  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.memoryPath, 'utf-8');
      this.memory = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, start with empty memory
      this.memory = { records: [] };
    }
  }

  async getContext(mode: AgentMode): Promise<Array<{ type: string; summary: string; timestamp: Date }>> {
    // Basic implementation: return recent relevant records
    return (this.memory.records || [])
      .filter((r: any) => r.tags && r.tags.includes(mode))
      .map((r: any) => ({
        type: r.type,
        summary: r.content.substring(0, 100) + '...',
        timestamp: new Date(r.timestamp)
      }));
  }

  async store(data: { agentId: string; type: string; content: string; tags: string[] }): Promise<void> {
    if (!this.memory.records) {
      this.memory.records = [];
    }
    
    this.memory.records.push({
      ...data,
      timestamp: new Date().toISOString()
    });

    await this.flush();
  }

  async flush(): Promise<void> {
    await fs.writeFile(this.memoryPath, JSON.stringify(this.memory, null, 2));
  }
}
