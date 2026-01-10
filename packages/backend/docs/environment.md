# Environment Configuration

The backend service is configured via environment variables. These are validated on startup using Zod.

## Core

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | enum | `development` | `development`, `production`, or `test`. |
| `PORT` | number | `3000` | Port for the backend server. |

## AI Providers

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `GEMINI_API_KEY` | string | **Yes** | API key for Google Gemini (primary/fallback model). |
| `OPENROUTER_API_KEY` | string | No | API key for OpenRouter (enables resilient multi-model routing). |

## Database & Storage

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `SUPABASE_URL` | url | **Yes** | URL of your Supabase instance. |
| `SUPABASE_KEY` | string | **Yes** | Anonymous or Service key for Supabase. |

## Search & Caching

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENSEARCH_HOST` | string | `https://localhost:9200` | URL for OpenSearch. |
| `OPENSEARCH_USERNAME` | string | `admin` | OpenSearch username. |
| `OPENSEARCH_PASSWORD` | string | `admin` | OpenSearch password. |
| `REDIS_HOST` | string | `localhost` | Hostname for Redis. |
| `REDIS_PORT` | number | `6379` | Port for Redis. |

## Observability (Langfuse)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LANGFUSE_ENABLED` | boolean | `true` | Enable/disable Langfuse tracing. |
| `LANGFUSE_HOST` | string | `http://localhost:3001` | URL for Langfuse server. |
| `LANGFUSE_PUBLIC_KEY` | string | - | Public key for project. |
| `LANGFUSE_SECRET_KEY` | string | - | Secret key for project. |

## Validation
Configuration is validated in `src/config/env.ts`. The application will crash on startup if required variables are missing or invalid, printing a helpful error message.
