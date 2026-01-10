import { AgentMode } from '../types/index.js';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  static validateTaskDescription(description: string): string {
    if (!description || description.trim().length === 0) {
      throw new ValidationError('Description cannot be empty');
    }
    return description.trim();
  }

  static validateAgentMode(mode: string): AgentMode {
    const validModes: AgentMode[] = [
      'architect', 'coder', 'tester', 'debugger', 'security', 
      'documentation', 'ingestor', 'analyzer', 'narrative', 
      'designer', 'validator', 'coordinator'
    ];
    
    if (!validModes.includes(mode as AgentMode)) {
      throw new ValidationError(`Invalid agent mode: ${mode}`);
    }
    return mode as AgentMode;
  }
}
