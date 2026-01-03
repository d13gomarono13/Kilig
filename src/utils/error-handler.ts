/**
 * Error handling utilities for Gemini Code Flow
 */

export class ErrorHandler {
  /**
   * Format error message safely, preserving context
   */
  static formatError(error: unknown, context?: string): string {
    const prefix = context ? `[${context}] ` : '';
    
    if (error instanceof Error) {
      return `${prefix}${error.message}`;
    }
    
    if (typeof error === 'string') {
      return `${prefix}${error}`;
    }
    
    return `${prefix}Unknown error: ${JSON.stringify(error)}`;
  }

  /**
   * Create a wrapped error with preserved stack trace
   */
  static wrapError(error: unknown, message: string, context?: string): Error {
    const wrappedError = new Error(message);
    
    if (error instanceof Error) {
      // Preserve original stack trace
      wrappedError.stack = `${wrappedError.stack}\nCaused by: ${error.stack}`;
      wrappedError.cause = error;
    }
    
    if (context) {
      (wrappedError as Error & { context?: string }).context = context;
    }
    
    return wrappedError;
  }

  /**
   * Check if error is a specific type
   */
  static isRateLimitError(error: unknown): boolean {
    const message = this.formatError(error).toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota exceeded') ||
      message.includes('429') ||
      message.includes('too many requests')
    );
  }

  /**
   * Check if error is network related
   */
  static isNetworkError(error: unknown): boolean {
    const message = this.formatError(error).toLowerCase();
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }

  /**
   * Check if error is authentication related
   */
  static isAuthError(error: unknown): boolean {
    const message = this.formatError(error).toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('invalid api key') ||
      message.includes('authentication')
    );
  }

  /**
   * Sanitize error message to prevent credential leakage
   */
  static sanitizeError(error: unknown): string {
    let message = this.formatError(error);
    
    // Remove potential API keys (basic patterns)
    message = message.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED]');
    message = message.replace(/key['"]\s*:\s*['"][^'"]+['"]/gi, 'key: "[REDACTED]"');
    message = message.replace(/token['"]\s*:\s*['"][^'"]+['"]/gi, 'token: "[REDACTED]"');
    message = message.replace(/bearer\s+[a-zA-Z0-9]+/gi, 'bearer [REDACTED]');
    
    return message;
  }

  /**
   * Retry with exponential backoff
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw this.wrapError(lastError, `Failed after ${maxRetries + 1} attempts`);
  }
}

export default ErrorHandler;