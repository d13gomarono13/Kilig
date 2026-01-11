/**
 * Logger utility for Kilig
 * 
 * Usage:
 *   import { createLogger } from '../utils/logger.js';
 *   const log = createLogger('HybridIndexer');
 *   log.info('Starting indexing', { paperId });
 */

import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && envLevel in LogLevel) {
    return LogLevel[envLevel as keyof typeof LogLevel];
  }
  return LogLevel.INFO;
}

export class Logger {
  private context: string;
  private level: LogLevel;

  constructor(context: string, level?: LogLevel) {
    this.context = context;
    // Read from env each time to support test mocking
    this.level = level ?? getLogLevelFromEnv();
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      const formatted = this.format('DEBUG', message, data);
      console.log(chalk.gray(formatted));
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      const formatted = this.format('INFO', message, data);
      console.log(chalk.blue(formatted));
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      const formatted = this.format('WARN', message, data);
      console.warn(chalk.yellow(formatted));
    }
  }

  error(message: string, error?: Error | Record<string, unknown>): void {
    if (this.level <= LogLevel.ERROR) {
      const data = error instanceof Error
        ? { error: error.message }
        : error;
      const formatted = this.format('ERROR', message, data);
      console.error(chalk.red(formatted));
    }
  }

  private format(level: string, message: string, data?: Record<string, unknown>): string {
    const base = `[${level}] [${this.context}] ${message}`;
    if (data && Object.keys(data).length > 0) {
      return `${base} ${JSON.stringify(data)}`;
    }
    return base;
  }
}

/**
 * Factory function for creating loggers.
 * 
 * @example
 * const log = createLogger('OpenSearchClient');
 * log.info('Connected', { host });
 * log.error('Failed to connect', err);
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Logger cache to avoid creating multiple instances for same context
const loggerCache: Map<string, Logger> = new Map();

/**
 * Get or create a cached logger for a context.
 * 
 * @example
 * const log = getLogger('HybridIndexer');
 */
export function getLogger(context: string): Logger {
  if (!loggerCache.has(context)) {
    loggerCache.set(context, new Logger(context));
  }
  return loggerCache.get(context)!;
}