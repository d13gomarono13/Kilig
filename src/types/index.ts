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

/**
 * Database Schema Types
 */
export interface ResearchCycle {
  id: string;
  created_at: string;
  title: string;
  topic_domain: string;
  start_date: string;
  end_date?: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  configuration: Record<string, any>;
  description?: string;
}

export interface PipelineRun {
  id: string;
  created_at: string;
  updated_at: string;
  cycle_id?: string;
  source_url?: string;
  source_title?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_duration_ms?: number;
  total_cost_estimated?: number;
  quality_score?: number;
  error_message?: string;
  metadata: Record<string, any>;
}

export interface PipelineStep {
  id: string;
  run_id: string;
  agent_name: string;
  step_order: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  input_context?: any;
  output_result?: any;
  error_log?: string;
}

export interface PipelineArtifact {
  id: string;
  created_at: string;
  run_id: string;
  step_id?: string;
  artifact_type: string;
  name: string;
  storage_path?: string;
  content_preview?: string;
  file_metadata: Record<string, any>;
}
