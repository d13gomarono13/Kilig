# Kilig Backend API Documentation

## Overview
The Kilig Backend provides a RESTful API (Fastify) for orchestrating multi-agent workflows, generating voiceovers, and retrieving analytics.

**Base URL**: `http://localhost:3000` (Default)

## Authentication
### Admin Routes
Protected routes require an API Key in the header.
- **Header**: `x-api-key`
- **Value**: Configured via `ADMIN_API_KEY` environment variable.

### Public Routes
Currently, agent triggering and voiceover generation are public for development/demo ease. In production, these should be protected via Supabase Auth (JWT).

## Endpoints

### 1. Agents (Orchestration)

#### `POST /api/trigger`
Starts a new multi-agent pipeline run.

- **Auth**: Public
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "query": "Create a video explaining Quantum Entanglement"
  }
  ```
- **Response**: **Server-Sent Events (SSE)** stream.
  - **Events**:
    - `project_created`: `{ type: 'project_created', projectId: '...', jobId: '...' }`
    - `agent_event`: `{ type: 'agent_event', author: 'scientist', text: '...' }` (Streamed tokens/updates)
    - `artifact_updated`: `{ type: 'artifact_updated', artifactType: 'script', content: '...' }`
    - `done`: `{ type: 'done', status: 'DONE' }`
    - `error`: `{ type: 'error', message: '...' }`

### 2. Voiceover (TTS)

#### `POST /api/voiceover`
Generates audio from text using Kokoro TTS.

- **Auth**: Public
- **Body**:
  ```json
  {
    "text": "Hello world",
    "voice": "af_heart",   // Optional (default: af_heart)
    "speed": 1.0           // Optional (default: 1.0)
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "audioBase64": "UklGRi..." // Wav/MP3 base64 string
  }
  ```

#### `GET /api/voiceover/voices`
List available voice profiles.

- **Response**:
  ```json
  {
    "voices": [
      { "id": "af_heart", "name": "Heart (Female)", "description": "Warm..." },
      ...
    ]
  }
  ```

### 3. Analytics (Admin)

#### `GET /api/analytics/runs`
Retrieve past pipeline executions.

- **Auth**: **Admin Key Required** (`x-api-key`)
- **Query Params**:
  - `limit`: Number of records (default 100)
- **Response**:
  ```json
  {
    "runs": [
      {
        "id": "...",
        "domain": "Physics",
        "status": "completed",
        "quality_score": 95,
        "total_duration_ms": 15000,
        "created_at": "2024-...",
        ...
      }
    ]
  }
  ```

### 4. System

#### `GET /health`
Health check endpoint.

- **Response**: `{ "status": "ok", "timestamp": "..." }`

## Security Features
- **Rate Limiting**: 60 requests per minute per IP. Returns `429 Too Many Requests`.
- **Input Sanitization**: All JSON bodies, query params, and route params are automatically sanitized to escape HTML characters (XSS protection).
