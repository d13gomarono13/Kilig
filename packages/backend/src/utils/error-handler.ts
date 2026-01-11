/**
 * Error handling utilities for Kilig
 */

import { AppError, isAppError, toAppError } from './app-error.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

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
      wrappedError.stack = `${wrappedError.stack}\nCaused by: ${error.stack}`;
      wrappedError.cause = error;
    }

    if (context) {
      (wrappedError as Error & { context?: string }).context = context;
    }

    return wrappedError;
  }

  /**
   * Check if error is rate limit related
   */
  static isRateLimitError(error: unknown): boolean {
    if (isAppError(error) && error.code === 'RATE_LIMITED') {
      return true;
    }
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

    // Remove potential API keys
    message = message.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED]');
    message = message.replace(/key['"]?\s*[:=]\s*['"]?[^'"\s]+['"]?/gi, 'key=[REDACTED]');
    message = message.replace(/token['"]?\s*[:=]\s*['"]?[^'"\s]+['"]?/gi, 'token=[REDACTED]');
    message = message.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'bearer [REDACTED]');

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

// ─────────────────────────────────────────────────────────────
// Fastify Error Handler Plugin
// ─────────────────────────────────────────────────────────────

/**
 * Register centralized error handling for Fastify.
 * 
 * Usage:
 *   app.register(registerErrorHandler);
 */
export async function registerErrorHandler(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((error: Error, _request: FastifyRequest, reply: FastifyReply) => {
    const isProd = process.env.NODE_ENV === 'production';

    // Convert to AppError if not already
    const appError = isAppError(error) ? error : toAppError(error);

    // Log the error (with sanitization in prod)
    const logMessage = isProd
      ? ErrorHandler.sanitizeError(error)
      : error.stack || error.message;

    console.error(`[ErrorHandler] ${appError.code}:`, logMessage);

    // Send response
    reply
      .status(appError.httpStatus)
      .send(isProd ? appError.toSafeJSON() : appError.toJSON(true));
  });
}

export default ErrorHandler;