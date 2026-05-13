# AGENTS.md — Project Lumina

## Quick Reference

- **Structure**: Two independent directories (`backend/`, `frontend/`) — NOT a monorepo
- **Backend**: FastAPI + Python 3.13, package manager: **`uv`** (not pip/poetry)
- **Frontend**: React 19 + Vite, package manager: npm
- **Database**: Supabase (PostgreSQL + **pgvector** extension required)
- **AI**: OpenAI API (`gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings) — requires `OPENAI_API_KEY` in `.env`

## Essential Commands

### Backend
```bash
cd backend
uv sync                          # Install dependencies (uses uv, not pip)
uv run uvicorn app.main:app --reload  # Dev server at :8000
uv run pytest                     # Run all tests
uv run pytest tests/unit/test_ingestion/  # Single directory
uv run ruff check .               # Lint
```

### Frontend
```bash
cd frontend
npm install                       # Install dependencies
npm run dev                       # Dev server at :5173 (CORS allowed origin)
npm run build                     # Production build
npm run lint                      # ESLint
```

## Setup Prerequisites (Easy to Miss)

1. **OpenAI API key** — add to `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   ```
   Set a $5 monthly hard limit in [OpenAI dashboard → Billing → Usage limits](https://platform.openai.com/usage-limits).

2. **Rate limiting**: Application enforces 10 requests/minute per user (configurable via `OPENAI_RATE_LIMIT_RPM`).

3. **Supabase pgvector extension** must be enabled (run in SQL Editor):
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   Then run the full setup SQL from `backend/Docs/DATABASE_SETUP.md`

4. **Environment files** needed in two locations:
   - `backend/.env` — `SUPABASE_URL`, `SUPABASE_KEY`, `OPENAI_API_KEY`
   - `frontend/.env` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Architecture Notes

- **Entry points**: `backend/app/main.py` (FastAPI), `frontend/src/main.jsx`
- **API routes**: Versioned under `backend/app/api/v1/endpoints/` (auth, ingestion, study)
- **CORS**: Backend hardcoded to `http://localhost:5173` (Vite default)
- **Services split**: `services/ingestion/` (PDF pipeline), `services/reasoning/` (AI/Socratic)
- **Database schema**: `document_sections` table stores 1536-dim embeddings for vector search
- **Frontend config**: API base URL hardcoded in `frontend/src/config.js` (points to `127.0.0.1:8000`)
- **Theme system**: `ThemeContext` toggles `.dark` class on `<html>`. CSS variables in `:root`/`.dark` control colors via semantic `@utility` classes (`bg-primary`, `text-secondary`, `border-default`). See `frontend/README.md` for usage.

## Testing

- **Framework**: pytest with pytest-asyncio for async endpoints
- **Fixtures**: Defined in `backend/tests/conftest.py` (mock Supabase + OpenAI)
- **Structure**: `tests/unit/` (by service) and `tests/integration/` (API tests)
- **No frontend tests configured** — only lint via ESLint

## Style & Conventions

- **Python**: Ruff linter, double quotes, indent-style space, line-length 88, targets py313
- **JavaScript**: ESLint flat config, React hooks rules, ignores `dist/`
- **No CI/CD config** found — verify before adding automated steps
- **No existing instruction files** (no CLAUDE.md, .cursorrules, or opencode.json)

## References

- Architecture details: `backend/Docs/ARCHITECTURE.md`
- Database setup: `backend/Docs/DATABASE_SETUP.md`
- Python deps: `backend/pyproject.toml` (uv-managed)
- Frontend deps: `frontend/package.json`