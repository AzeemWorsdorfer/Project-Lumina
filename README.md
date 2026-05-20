# Lumina

### AI-Powered Socratic Learning

**Proof of Concept** &nbsp;|&nbsp; [LinkedIn](https://www.linkedin.com/in/muhammad-azeem-worsdorfer)

---

## About

Lumina is a proof-of-concept exploring how AI can transform passive reading into active, relational thinking. It uses Socratic questioning and interactive mind mapping to help students identify knowledge gaps in real-time. A full-featured version is planned for commercial release.

This project demonstrates full-stack development skills, AI/ML integration, and building products with real-world educational impact.

## Problem & Solution

**Problem:** Students often read passively—highlighting text without truly understanding or retaining concepts.

**Solution:** Lumina tracks your mental model through an interactive mind map, identifies gaps in your knowledge, and guides you with Socratic questions to deepen comprehension—turning passive reading into active learning.

## Features

- **PDF Upload** — Ingest textbooks and papers with semantic chunking
- **Mind Map Editor** — Interactive concept mapping with ReactFlow
- **Socratic Hints** — AI-powered questions to guide learning when stuck
- **Quiz Generator** — Auto-generate 3-question multiple-choice quizzes from study material
- **Gap Analysis** — Identifies missed relationships and misconceptions
- **Pomodoro Timer** — Timed study sessions for focused learning

## Screenshots

### Authentication
![Login](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Mind Map Editor
![Mind Map](screenshots/mind-map.png)

### Socratic Hints
![Socratic AI](screenshots/socratic-ai.png)

### Quiz Generator
![Quiz](screenshots/quiz.png)

### Pomodoro Timer
![Pomodoro](screenshots/pomodoro.png)

## Technical Highlights

- **RAG Pipeline** — Vector similarity search with pgvector for semantic retrieval
- **OpenAI Integration** — GPT-4o-mini for Socratic reasoning, text-embedding-3-small for embeddings
- **Full-Stack Architecture** — React frontend + FastAPI backend
- **Real-Time Gap Detection** — Algorithm that surfaces knowledge blind spots
- **Rate Limiting** — 10 requests/minute per user (configurable) with $5/month spending cap

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + ReactFlow |
| Backend | FastAPI (Python 3.13) |
| Database | Supabase (PostgreSQL + pgvector) |
| AI | OpenAI (GPT-4o-mini + text-embedding-3-small) |

## Getting Started

### 1. Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Setup

Create a `.env` file in the `backend/` directory with:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=sk-...
```

Set a $5/month hard limit in [OpenAI Dashboard → Billing → Usage limits](https://platform.openai.com/usage-limits).

## Project Structure

```
Lumina/
├── backend/                      # FastAPI API
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── api/v1/               # API routes
│   │   │   ├── deps/             # Dependencies (auth)
│   │   │   └── endpoints/       # Route handlers
│   │   ├── core/                 # Core utilities
│   │   ├── schemas/              # Pydantic models
│   │   └── services/             # Business logic
│   │       ├── ingestion/       # PDF processing
│   │       └── reasoning/        # AI/Socratic services
│   ├── Docs/                     # Architecture & database docs
│   ├── tests/                    # Unit & integration tests
│   └── uploads/                  # Temporary PDF storage
└── frontend/                     # React client
    └── src/
        ├── components/           # React components
        ├── pages/                # Page components
        ├── contexts/             # React contexts
        ├── services/             # API services
        ├── lib/                  # Libraries
        └── utils/                # Utilities
```

## Contact

- [LinkedIn](https://www.linkedin.com/in/muhammad-azeem-worsdorfer)
