/**
 * Structured error class for consistent error handling across the application.
 * 
 * Usage:
 *   throw AppError.badRequest('INVALID_ARXIV_ID', 'ArXiv ID must match format XXXX.XXXXX');
 *   throw AppError.internal('EMBEDDING_FAILED', 'Embedding generation failed', originalError);
 */

export type ErrorCode =
    // Input Validation
    | 'INVALID_INPUT'
    | 'INVALID_ARXIV_ID'
    | 'MISSING_REQUIRED_FIELD'
    | 'VALIDATION_FAILED'
    // Resource Errors
    | 'NOT_FOUND'
    | 'PAPER_NOT_FOUND'
    | 'INDEX_NOT_FOUND'
    // External Service Errors
    | 'EMBEDDING_FAILED'
    | 'LLM_FAILED'
    | 'OPENSEARCH_ERROR'
    | 'SUPABASE_ERROR'
    | 'RATE_LIMITED'
    // Processing Errors
    | 'INGESTION_FAILED'
    | 'PARSING_FAILED'
    | 'PIPELINE_FAILED'
    // Generic
    | 'INTERNAL_ERROR'
    | 'UNKNOWN_ERROR';

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly httpStatus: number;
    public readonly timestamp: Date;
    public readonly cause?: Error;

    constructor(
        code: ErrorCode,
        httpStatus: number,
        message: string,
        cause?: Error
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.httpStatus = httpStatus;
        this.timestamp = new Date();
        this.cause = cause;

        // Maintain proper stack trace
        Error.captureStackTrace(this, AppError);
    }

    // ─────────────────────────────────────────────────────────────
    // Factory methods for common error types
    // ─────────────────────────────────────────────────────────────

    static badRequest(code: ErrorCode, message: string): AppError {
        return new AppError(code, 400, message);
    }

    static notFound(code: ErrorCode, message: string): AppError {
        return new AppError(code, 404, message);
    }

    static rateLimited(message: string = 'Rate limit exceeded'): AppError {
        return new AppError('RATE_LIMITED', 429, message);
    }

    static internal(code: ErrorCode, message: string, cause?: Error): AppError {
        return new AppError(code, 500, message, cause);
    }

    // ─────────────────────────────────────────────────────────────
    // Serialization
    // ─────────────────────────────────────────────────────────────

    toJSON(includeStack = false): Record<string, unknown> {
        const json: Record<string, unknown> = {
            error: this.code,
            message: this.message,
            status: this.httpStatus,
            timestamp: this.timestamp.toISOString(),
        };

        if (includeStack && process.env.NODE_ENV !== 'production') {
            json.stack = this.stack;
            if (this.cause) {
                json.cause = this.cause.message;
            }
        }

        return json;
    }

    /**
     * Production-safe JSON (no stack traces)
     */
    toSafeJSON(): Record<string, unknown> {
        return {
            error: this.code,
            message: this.message,
            status: this.httpStatus,
        };
    }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

/**
 * Wrap any error into an AppError
 */
export function toAppError(error: unknown, fallbackCode: ErrorCode = 'UNKNOWN_ERROR'): AppError {
    if (isAppError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return AppError.internal(fallbackCode, error.message, error);
    }

    return AppError.internal(fallbackCode, String(error));
}
