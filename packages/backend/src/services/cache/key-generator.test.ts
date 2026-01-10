/**
 * Unit tests for the Cache Key Generator
 */
import { describe, it, expect } from 'vitest';
import { CacheKeyGenerator } from './key-generator.js';

describe('CacheKeyGenerator', () => {
    describe('generate', () => {
        it('should generate consistent hash for same string input', () => {
            const hash1 = CacheKeyGenerator.generate('test string');
            const hash2 = CacheKeyGenerator.generate('test string');

            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
        });

        it('should generate different hashes for different inputs', () => {
            const hash1 = CacheKeyGenerator.generate('input one');
            const hash2 = CacheKeyGenerator.generate('input two');

            expect(hash1).not.toBe(hash2);
        });

        it('should add prefix when provided', () => {
            const hash = CacheKeyGenerator.generate('test', 'embeddings');

            expect(hash).toMatch(/^embeddings:[a-f0-9]{64}$/);
        });

        it('should generate consistent hash for objects regardless of key order', () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { c: 3, b: 2, a: 1 };

            const hash1 = CacheKeyGenerator.generate(obj1);
            const hash2 = CacheKeyGenerator.generate(obj2);

            expect(hash1).toBe(hash2);
        });

        it('should handle arrays', () => {
            const hash = CacheKeyGenerator.generate([1, 2, 3]);

            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should handle numbers', () => {
            const hash = CacheKeyGenerator.generate(42);

            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should handle booleans', () => {
            const hashTrue = CacheKeyGenerator.generate(true);
            const hashFalse = CacheKeyGenerator.generate(false);

            expect(hashTrue).toMatch(/^[a-f0-9]{64}$/);
            expect(hashTrue).not.toBe(hashFalse);
        });

        it('should handle null and undefined', () => {
            const hashNull = CacheKeyGenerator.generate(null);
            const hashUndefined = CacheKeyGenerator.generate(undefined);

            expect(hashNull).toMatch(/^[a-f0-9]{64}$/);
            expect(hashUndefined).toMatch(/^[a-f0-9]{64}$/);
            expect(hashNull).toBe(hashUndefined); // Both normalize to ''
        });

        it('should handle nested objects', () => {
            const nested = {
                outer: {
                    inner: {
                        value: 'deep'
                    }
                },
                array: [1, 2, 3]
            };

            const hash = CacheKeyGenerator.generate(nested);

            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should produce same hash for identical model+text combinations', () => {
            const input1 = { model: 'text-embedding-004', text: 'hello world' };
            const input2 = { model: 'text-embedding-004', text: 'hello world' };

            const hash1 = CacheKeyGenerator.generate(input1, 'embeddings');
            const hash2 = CacheKeyGenerator.generate(input2, 'embeddings');

            expect(hash1).toBe(hash2);
        });

        it('should produce different hash for different texts', () => {
            const input1 = { model: 'text-embedding-004', text: 'hello world' };
            const input2 = { model: 'text-embedding-004', text: 'goodbye world' };

            const hash1 = CacheKeyGenerator.generate(input1, 'embeddings');
            const hash2 = CacheKeyGenerator.generate(input2, 'embeddings');

            expect(hash1).not.toBe(hash2);
        });
    });
});
