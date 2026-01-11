/**
 * Unit tests for the Logger utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from './logger.js';

describe('Logger', () => {
    const originalEnv = process.env.LOG_LEVEL;

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.env.LOG_LEVEL = originalEnv;
    });

    describe('LogLevel enum', () => {
        it('should have correct log level values', () => {
            expect(LogLevel.DEBUG).toBe(0);
            expect(LogLevel.INFO).toBe(1);
            expect(LogLevel.WARN).toBe(2);
            expect(LogLevel.ERROR).toBe(3);
        });
    });

    describe('constructor', () => {
        it('should create logger with context', () => {
            const logger = new Logger('TestContext');

            expect(logger).toBeDefined();
        });

        it('should respect LOG_LEVEL environment variable', () => {
            process.env.LOG_LEVEL = 'DEBUG';
            const logger = new Logger('Test');

            logger.debug('Debug message');

            expect(console.log).toHaveBeenCalled();
        });
    });

    describe('info', () => {
        it('should log info messages by default', () => {
            const logger = new Logger('TestApp');

            logger.info('Info message');

            expect(console.log).toHaveBeenCalled();
        });

        it('should include context in message', () => {
            const logger = new Logger('MyApp');

            logger.info('Test message');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('[MyApp]'),
                // No additional args
            );
        });

        it('should pass additional arguments', () => {
            const logger = new Logger('App');

            logger.info('Message with data', { key: 'value' });

            // New API includes data in the message string
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('{"key":"value"}'),
            );
        });
    });

    describe('warn', () => {
        it('should log warning messages', () => {
            const logger = new Logger('WarnTest');

            logger.warn('Warning message');

            expect(console.warn).toHaveBeenCalled();
        });

        it('should include context in warning', () => {
            const logger = new Logger('WarnApp');

            logger.warn('Potential issue');

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('[WarnApp]'),
            );
        });
    });

    describe('error', () => {
        it('should log error messages', () => {
            const logger = new Logger('ErrorTest');

            logger.error('Error occurred');

            expect(console.error).toHaveBeenCalled();
        });

        it('should include context in error', () => {
            const logger = new Logger('ErrorApp');

            logger.error('Critical failure');

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[ErrorApp]'),
            );
        });
    });

    describe('debug', () => {
        it('should not log debug by default (INFO level)', () => {
            delete process.env.LOG_LEVEL;
            const logger = new Logger('DebugTest');

            logger.debug('Debug info');

            // Default level is INFO, so DEBUG should not appear
            // The call count includes any prior calls
            expect(console.log).not.toHaveBeenCalledWith(
                expect.stringContaining('[DEBUG]'),
            );
        });

        it('should log debug when LOG_LEVEL is DEBUG', () => {
            process.env.LOG_LEVEL = 'DEBUG';
            const logger = new Logger('DebugApp');

            logger.debug('Debugging');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('[DEBUG]'),
            );
        });
    });

    describe('log level filtering', () => {
        it('should not log info when level is WARN', () => {
            process.env.LOG_LEVEL = 'WARN';
            const logger = new Logger('FilterTest');

            logger.info('Should not appear');

            expect(console.log).not.toHaveBeenCalled();
        });

        it('should log warn when level is WARN', () => {
            process.env.LOG_LEVEL = 'WARN';
            const logger = new Logger('FilterTest');

            logger.warn('Should appear');

            expect(console.warn).toHaveBeenCalled();
        });

        it('should only log error when level is ERROR', () => {
            process.env.LOG_LEVEL = 'ERROR';
            const logger = new Logger('ErrorOnly');

            logger.info('No');
            logger.warn('No');
            logger.error('Yes');

            expect(console.log).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
        });
    });
});
