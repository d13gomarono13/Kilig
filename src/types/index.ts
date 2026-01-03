/**
 * Agent Mode Definitions
 */
export type AgentMode = 
  | 'architect' 
  | 'coder' 
  | 'tester' 
  | 'debugger' 
  | 'security' 
  | 'documentation'
  | 'ingestor'
  | 'analyzer'
  | 'narrative'
  | 'designer'
  | 'validator'
  | 'coordinator';

/**
 * Task Definition
 */
export interface Task {
  id: string;
  description: string;
  mode: AgentMode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies?: string[];
  retryCount?: number;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent Definition
 */
export interface Agent {
  id: string;
  mode: AgentMode;
  status: 'running' | 'completed' | 'failed';
  task: string;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

/**
 * Configuration Interfaces
 */
export interface OrchestratorConfig {
  maxAgents: number;
  memoryPath: string;
  apiKey?: string;
  authMethod: 'google-account' | 'api-key';
  modes: Record<string, string>;
}

export interface ConfigFile {
  maxAgents?: number;
  memoryPath?: string;
  apiKey?: string;
  authMethod?: 'google-account' | 'api-key';
  modes?: Record<string, string>;
}
