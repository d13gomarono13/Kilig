import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    // Core
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),

    // AI Providers
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
    OPENROUTER_API_KEY: z.string().optional(),

    // Databases
    SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
    SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY is required'),

    // Search & Cache
    // Defaulting to typical local Docker defaults if not provided
    OPENSEARCH_HOST: z.string().default('https://localhost:9200'),
    OPENSEARCH_USERNAME: z.string().default('admin'),
    OPENSEARCH_PASSWORD: z.string().default('admin'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default('6379'),

    // Observability
    LANGFUSE_ENABLED: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
    LANGFUSE_PUBLIC_KEY: z.string().optional(),
    LANGFUSE_SECRET_KEY: z.string().optional(),
    LANGFUSE_HOST: z.string().default('http://localhost:3001'),
});

// Validate environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:');
    _env.error.format()._errors.forEach((e) => {
        console.error(`  - ${e}`);
    });
    // Also log field-specific errors for better debugging
    Object.entries(_env.error.format()).forEach(([key, value]) => {
        if (key !== '_errors' && (value as any)._errors.length > 0) {
            console.error(`  - ${key}: ${(value as any)._errors.join(', ')}`);
        }
    });
    process.exit(1);
}

export const env = _env.data;
