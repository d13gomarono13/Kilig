export interface WorkflowState {
    // Input context
    text: string;

    // Classification (Determines pipeline path)
    classification: 'video' | 'comic' | 'unknown';

    // Scientist Artifacts
    entities: string[];
    analysisResults?: any;  // Structured output from Scientist

    // Narrative Artifacts
    manifestJson?: any;      // Comic manifest or Video script

    // Validator Artifacts
    validationResult?: {
        isValid: boolean;
        errors?: string[];
        feedback?: string;
    };

    // Execution Metadata
    conversationHistory: any[]; // Chat history for context
    lastToolCall?: string;
    error?: string;
}

export type WorkflowStep = 'start' | 'scientist' | 'narrative' | 'designer' | 'validator' | 'done' | 'error';
