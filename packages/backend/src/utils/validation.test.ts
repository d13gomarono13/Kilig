/**
 * Unit tests for the Validator utility
 */
import { describe, it, expect } from 'vitest';
import { Validator, ValidationError } from './validation.js';

describe('ValidationError', () => {
    it('should create error with message', () => {
        const error = new ValidationError('Invalid input');

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Invalid input');
        expect(error.name).toBe('ValidationError');
    });

    it('should store field property', () => {
        const error = new ValidationError('Invalid value', 'email');

        expect(error.field).toBe('email');
    });
});

describe('Validator', () => {
    describe('validateTaskDescription', () => {
        it('should return trimmed description for valid input', () => {
            const result = Validator.validateTaskDescription('  Create a new feature  ');

            expect(result).toBe('Create a new feature');
        });

        it('should throw for empty string', () => {
            expect(() => Validator.validateTaskDescription('')).toThrow(ValidationError);
        });

        it('should throw for whitespace-only string', () => {
            expect(() => Validator.validateTaskDescription('   ')).toThrow(ValidationError);
        });

        it('should throw with appropriate message', () => {
            expect(() => Validator.validateTaskDescription('')).toThrow('Description cannot be empty');
        });
    });

    describe('validateAgentMode', () => {
        it('should accept valid architect mode', () => {
            expect(Validator.validateAgentMode('architect')).toBe('architect');
        });

        it('should accept valid coder mode', () => {
            expect(Validator.validateAgentMode('coder')).toBe('coder');
        });

        it('should accept valid tester mode', () => {
            expect(Validator.validateAgentMode('tester')).toBe('tester');
        });

        it('should accept valid debugger mode', () => {
            expect(Validator.validateAgentMode('debugger')).toBe('debugger');
        });

        it('should accept valid ingestor mode', () => {
            expect(Validator.validateAgentMode('ingestor')).toBe('ingestor');
        });

        it('should accept valid analyzer mode', () => {
            expect(Validator.validateAgentMode('analyzer')).toBe('analyzer');
        });

        it('should accept valid narrative mode', () => {
            expect(Validator.validateAgentMode('narrative')).toBe('narrative');
        });

        it('should accept valid designer mode', () => {
            expect(Validator.validateAgentMode('designer')).toBe('designer');
        });

        it('should accept valid validator mode', () => {
            expect(Validator.validateAgentMode('validator')).toBe('validator');
        });

        it('should accept valid coordinator mode', () => {
            expect(Validator.validateAgentMode('coordinator')).toBe('coordinator');
        });

        it('should throw for invalid mode', () => {
            expect(() => Validator.validateAgentMode('invalid')).toThrow(ValidationError);
        });

        it('should include invalid mode in error message', () => {
            expect(() => Validator.validateAgentMode('unknown')).toThrow('Invalid agent mode: unknown');
        });
    });
});
