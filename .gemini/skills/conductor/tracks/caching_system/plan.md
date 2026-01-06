# Smart Caching Layer Implementation Plan

## Objective
Implement a robust, flexible caching system to drastically reduce Gemini API costs and latency during the development and testing of the Kilig multi-agent pipeline.

## Problem Statement
- **High Cost/Latency**: Iterating on downstream agents (e.g., Designer, Validator) requires re-running upstream agents (Scientist, Narrative), incurring repeated costs and waiting time.
- **Rate Limits**: The 'gemini-2.0-flash' free tier has strict rate limits, causing 429 errors during deep pipeline tests.
- **Non-Determinism**: Variable outputs from upstream agents make debugging downstream logic difficult.

## Strategy
We will implement a **Cache Provider Pattern** that allows seamless switching between storage backends (File System initially, Redis in the future) without changing application logic.

### Architectural Core
1.  **`ICacheProvider`**: A generic interface for `get(key)`, `set(key, value, ttl)`, and `has(key)`.
2.  **`FileSystemCache`**: A simple, persistent JSON-based implementation for local development.
3.  **`CacheManager`**: A singleton service that initializes the correct provider based on `CACHE_PROVIDER` env var.
4.  **Key Generation**: A deterministic hashing utility (SHA-256) to create unique keys from prompts, model parameters, and system instructions.

### Integration Points
1.  **Gemini Client**: Intercept `execute` and `streamExecute` calls.
    -   Key: `hash(model_name + system_instruction + user_prompt)`
2.  **Embeddings Service**: Intercept `generateEmbedding` calls.
    -   Key: `hash(model_name + text_content)`
    -   *Note*: This will provide the highest volume of cache hits.

## Phases

### Phase 1: Foundation & File Cache (Completed)
- [x] Create `src/services/cache/types.ts` defining `ICacheProvider`.
- [x] Create `src/services/cache/file-system-cache.ts` implementing the interface using `fs/promises`.
- [x] Create `src/services/cache/key-generator.ts` for SHA-256 hashing.
- [x] Create `src/services/cache/index.ts` (CacheManager) to expose the singleton.

### Phase 2: Core Service Integration (Completed)
- [x] Refactor `src/core/gemini-client.ts` to use `CacheManager`.
- [x] Refactor `src/services/embeddings.ts` to use `CacheManager`.

### Phase 3: Configuration & Controls (Completed)
- [x] Update `.env` support for:
    -   `CACHE_ENABLED=true/false`
    -   `CACHE_PROVIDER=file|redis`
    -   `CACHE_TTL=86400` (24 hours default)
    -   `CACHE_DIR=.cache`
- [x] Add CLI utility or script `scripts/clear-cache.ts` to easily purge the cache.

### Phase 4: Future Proofing (Redis) (Planned)
- [ ] Create `src/services/cache/redis-cache.ts` implementing `ICacheProvider` using `ioredis`.
- [ ] Update `CacheManager` to support `redis` provider.

## Testing
- [x] Create a unit test `src/tests/cache.test.ts` ensuring the file system cache persists and retrieves correctly.
- [ ] Run `scripts/test_pipeline.ts` twice.
    -   Run 1: Should take normal time (Cache Miss).
    -   Run 2: Should be near-instant (Cache Hit).
