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
            ]
            // Thresholds commented out during incremental development
            // Will be re-enabled when targeting >60% coverage
            // thresholds: {
            //     statements: 60,
            //     branches: 60,
            //     functions: 60,
            //     lines: 60
            // }
        },
        setupFiles: ['./tests/setup.ts']
    }
});
