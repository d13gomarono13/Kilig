// Global test setup for Vitest
import { beforeEach, afterEach } from 'vitest';
import 'dotenv/config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.CACHE_ENABLED = 'false';
process.env.LANGFUSE_ENABLED = 'false';

// Global test utilities
beforeEach(() => {
    // Reset mocks before each test
});

afterEach(() => {
    // Cleanup after each test
});
