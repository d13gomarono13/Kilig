import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.test.ts',
                'src/**/index.ts', // Entry points
                'node_modules/**'
            ],
            thresholds: {
                statements: 50,
                branches: 40,
                functions: 50,
                lines: 50
            }
        },
        setupFiles: ['./tests/setup.ts']
    }
});
