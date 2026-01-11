import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./scripts/tests/setup.ts'],
        testTimeout: 120000, // 2 minutes for integration tests with agent pipeline
        hookTimeout: 30000, // 30s for setup/teardown
    },
});
