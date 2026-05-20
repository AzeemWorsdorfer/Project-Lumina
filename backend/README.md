# Lumina Backend

FastAPI backend for the Lumina Socratic mind mapping application.

## Prerequisites

- Python 3.13+
- [uv](https://github.com/astral-sh/uv) package manager
- OpenAI API key (GPT-4o-mini for chat, text-embedding-3-small for embeddings)
- Supabase project (PostgreSQL + pgvector)

## Setup

1. Install dependencies:
```bash
uv sync
```

2. Configure environment variables in `.env`:
```bash
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

3. Set up the database:
```bash
# Run the SQL in Docs/DATABASE_SETUP.md in your Supabase SQL Editor
```

4. Start the server:
```bash
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase service role key |
| `OPENAI_API_KEY` | Your OpenAI API key (sk-...) |
| `OPENAI_CHAT_MODEL` | Chat model (default: gpt-4o-mini) |
| `OPENAI_EMBEDDING_MODEL` | Embedding model (default: text-embedding-3-small) |
| `OPENAI_RATE_LIMIT_RPM` | Rate limit per user (default: 10) |
| `OPENAI_MONTHLY_LIMIT_USD` | Monthly spending cap in USD (default: 5) |

## API Endpoints

### Authentication
- `GET /api/v1/me` - Get current authenticated user

### Session Management
- `GET /api/v1/sessions` - List all study sessions
- `GET /api/v1/session/{session_id}` - Get session details
- `DELETE /api/v1/session/{session_id}` - Delete a session
- `GET /api/v1/session/{session_id}/pdf-url` - Get signed URL for PDF

### Ingestion
- `POST /api/v1/upload-pdf` - Upload PDF and create study session

### Study
- `PUT /api/v1/{session_id}/map` - Save mind map state
- `POST /api/v1/get-socratic-hint` - Get Socratic hint
- `POST /api/v1/get-socratic-hint-stream` - Get streaming Socratic hint
- `POST /api/v1/generate-quiz` - Generate 3-question multiple-choice quiz

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── api/v1/
│   │   ├── deps/              # Dependencies (auth middleware)
│   │   │   └── auth.py
│   │   └── endpoints/         # API route handlers
│   │       ├── auth.py        # Authentication endpoints
│   │       ├── ingestion.py   # PDF upload endpoints
│   │       └── study.py       # Study session endpoints
│   ├── core/
│   │   └── database.py        # Supabase client configuration
│   ├── schemas/
│   │   └── mindmap.py         # Pydantic models
│   └── services/
│       ├── ingestion/         # PDF processing pipeline
│       │   ├── pdf_service.py
│       │   ├── text_processor.py
│       │   └── vector_service.py
│       └── reasoning/         # AI/Socratic services
│           ├── ai_service.py
│           ├── prompt.py
│           ├── search_service.py
│           └── session_manager.py
├── Docs/                       # Architecture & database docs
│   ├── ARCHITECTURE.md
│   └── DATABASE_SETUP.md
├── tests/                      # Unit & integration tests
│   ├── unit/
│   │   ├── test_ingestion/
│   │   └── test_reasoning/
│   ├── integration/
│   └── conftest.py
├── uploads/                    # Temporary PDF storage
├── pyproject.toml
├── uv.lock
└── .env.example
```

## Development

Run tests:
```bash
uv run pytest
```

Run linter:
```bash
uv run ruff check .
```

## AI Models

Uses OpenAI API with:
- **GPT-4o-mini** — For Socratic hint generation and quiz creation
- **text-embedding-3-small** — For vector embeddings and semantic search

Set a $5/month hard limit in [OpenAI Dashboard → Billing → Usage limits](https://platform.openai.com/usage-limits).
