/**
 * Unit tests for the ErrorHandler utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from './error-handler.js';

describe('ErrorHandler', () => {
    describe('formatError', () => {
        it('should format Error instance with message', () => {
            const error = new Error('Something went wrong');
            const result = ErrorHandler.formatError(error);

            expect(result).toBe('Something went wrong');
        });

        it('should format Error with context prefix', () => {
            const error = new Error('Connection failed');
            const result = ErrorHandler.formatError(error, 'Database');

            expect(result).toBe('[Database] Connection failed');
        });

        it('should format string error', () => {
            const result = ErrorHandler.formatError('Simple error message');

            expect(result).toBe('Simple error message');
        });

        it('should format string error with context', () => {
            const result = ErrorHandler.formatError('API failed', 'HTTP');

            expect(result).toBe('[HTTP] API failed');
        });

        it('should handle unknown error types', () => {
            const result = ErrorHandler.formatError({ code: 500 });

            expect(result).toContain('Unknown error');
            expect(result).toContain('500');
        });

        it('should handle null error', () => {
            const result = ErrorHandler.formatError(null);

            expect(result).toContain('Unknown error');
        });
    });

    describe('wrapError', () => {
        it('should create wrapped error with message', () => {
            const result = ErrorHandler.wrapError(null, 'Wrapped message');

            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('Wrapped message');
        });

        it('should preserve original error as cause', () => {
            const original = new Error('Original error');
            const result = ErrorHandler.wrapError(original, 'Wrapped');

            expect(result.cause).toBe(original);
        });

        it('should preserve original stack trace', () => {
            const original = new Error('Original');
            const result = ErrorHandler.wrapError(original, 'Wrapped');

            expect(result.stack).toContain('Caused by');
            expect(result.stack).toContain('Original');
        });

        it('should add context property when provided', () => {
            const result = ErrorHandler.wrapError(null, 'Message', 'MyContext');

            expect((result as any).context).toBe('MyContext');
        });
    });

    describe('isRateLimitError', () => {
        it('should detect rate limit message', () => {
            expect(ErrorHandler.isRateLimitError(new Error('Rate limit exceeded'))).toBe(true);
        });

        it('should detect 429 status code', () => {
            expect(ErrorHandler.isRateLimitError('Error 429: Too many requests')).toBe(true);
        });

        it('should detect quota exceeded', () => {
            expect(ErrorHandler.isRateLimitError(new Error('Quota exceeded for this model'))).toBe(true);
        });

        it('should detect too many requests', () => {
            expect(ErrorHandler.isRateLimitError('Too many requests sent')).toBe(true);
        });

        it('should return false for other errors', () => {
            expect(ErrorHandler.isRateLimitError(new Error('Connection refused'))).toBe(false);
        });
    });

    describe('isNetworkError', () => {
        it('should detect network error', () => {
            expect(ErrorHandler.isNetworkError(new Error('Network error occurred'))).toBe(true);
        });

        it('should detect connection error', () => {
            expect(ErrorHandler.isNetworkError('Connection refused')).toBe(true);
        });

        it('should detect timeout', () => {
            expect(ErrorHandler.isNetworkError(new Error('Request timeout'))).toBe(true);
        });

        it('should detect ECONNREFUSED', () => {
            expect(ErrorHandler.isNetworkError('ECONNREFUSED')).toBe(true);
        });

        it('should detect ENOTFOUND', () => {
            expect(ErrorHandler.isNetworkError(new Error('ENOTFOUND'))).toBe(true);
        });

        it('should return false for auth errors', () => {
            expect(ErrorHandler.isNetworkError(new Error('Unauthorized'))).toBe(false);
        });
    });

    describe('isAuthError', () => {
        it('should detect unauthorized', () => {
            expect(ErrorHandler.isAuthError(new Error('Unauthorized'))).toBe(true);
        });

        it('should detect 401 status', () => {
            expect(ErrorHandler.isAuthError('Error 401: Unauthorized')).toBe(true);
        });

        it('should detect 403 status', () => {
            expect(ErrorHandler.isAuthError(new Error('403 Forbidden'))).toBe(true);
        });

        it('should detect invalid API key', () => {
            expect(ErrorHandler.isAuthError('Invalid API key provided')).toBe(true);
        });

        it('should detect authentication error', () => {
            expect(ErrorHandler.isAuthError(new Error('Authentication failed'))).toBe(true);
        });

        it('should return false for network errors', () => {
            expect(ErrorHandler.isAuthError(new Error('Connection timeout'))).toBe(false);
        });
    });

    describe('sanitizeError', () => {
        it('should redact long alphanumeric strings (API keys)', () => {
            const error = new Error('Key: sk_live_abcdefghijklmnopqrstuvwxyz123456');
            const result = ErrorHandler.sanitizeError(error);

            expect(result).toContain('[REDACTED]');
            expect(result).not.toContain('abcdefghijklmnopqrstuvwxyz123456');
        });

        it('should redact key patterns in JSON', () => {
            // Keys with 32+ characters get redacted
            const error = 'Error with key: "sk_test_abcdefghijklmnopqrstuvwxyz123456"';
            const result = ErrorHandler.sanitizeError(error);

            expect(result).toContain('[REDACTED]');
        });

        it('should redact bearer tokens', () => {
            const error = new Error('Authorization: Bearer abc123token456');
            const result = ErrorHandler.sanitizeError(error);

            expect(result).toContain('[REDACTED]');
        });

        it('should preserve short error messages', () => {
            const error = new Error('Simple error');
            const result = ErrorHandler.sanitizeError(error);

            expect(result).toBe('Simple error');
        });
    });

    describe('retryWithBackoff', () => {
        it('should return result on first success', async () => {
            const fn = vi.fn().mockResolvedValue('success');

            const result = await ErrorHandler.retryWithBackoff(fn, 3, 10, 50);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and succeed', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockResolvedValueOnce('success');

            const result = await ErrorHandler.retryWithBackoff(fn, 3, 10, 50);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should throw after max retries', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

            await expect(
                ErrorHandler.retryWithBackoff(fn, 1, 10, 50)
            ).rejects.toThrow('Failed after 2 attempts');

            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
});
