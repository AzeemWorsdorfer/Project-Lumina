# System Architecture

## Project Overview

Lumina is an AI-powered study companion that facilitates active learning through Socratic mind mapping. The system ingests academic content and guides users in building relational knowledge structures through intelligent questioning.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   Supabase      │
│   (React)       │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   OpenAI API    │
                        │ (gpt-4o-mini +  │
                        │ text-embedding- │
                        │     3-small)    │
                        └─────────────────┘
```

## Service Layer Architecture

### Ingestion Services (`app/services/ingestion/`)
- **pdf_service.py**: PDF text extraction and validation
- **text_processor.py**: Semantic chunking (~400 token blocks)
- **vector_service.py**: Embedding generation and batch processing
- **__init__.py**: Service coordination and error handling

### Reasoning Services (`app/services/reasoning/`)
- **ai_service.py**: Socratic hint generation using OpenAI (gpt-4o-mini)
- **search_service.py**: Vector similarity search and context retrieval
- **session_manager.py**: Study session lifecycle management
- **prompt.py**: Specialized prompt engineering for Socratic tutoring

## Data Flow

### 1. Content Ingestion Pipeline

```
PDF Upload → Text Extraction → Semantic Chunking → Vector Embedding → Database Storage
```

- `POST /api/v1/upload-pdf` receives PDF and creates study session
- `pdf_service.py` extracts raw text with page tracking
- `text_processor.py` performs sentence-aware chunking
- `vector_service.py` batches embeddings for storage
- Chunks stored in Supabase `document_sections` with metadata

### 2. Socratic Learning Loop

```
Mind Map State → Context Retrieval → AI Reasoning → Socratic Hint → User Response
```

- `POST /api/v1/get-socratic-hint` analyzes current mind map topology
- `search_service.py` performs vector similarity search on user concepts
- `ai_service.py` generates contextual Socratic questions
- Real-time mind map synchronization via `PUT /api/v1/{session_id}/map`

## API Endpoints

### Auth Router (`/api/v1`)
- `GET /me` - Get current authenticated user

### Ingestion Router (`/api/v1`)
- `POST /upload-pdf` - Process PDF and initialize study session

### Study Router (`/api/v1`)
- `GET /sessions` - List all study sessions
- `GET /session/{session_id}` - Retrieve session state
- `DELETE /session/{session_id}` - Delete a session
- `GET /session/{session_id}/pdf-url` - Get signed PDF URL
- `PUT /{session_id}/map` - Save mind map state (nodes & edges)
- `POST /get-socratic-hint` - Generate AI-guided questions
- `POST /get-socratic-hint-stream` - Streaming Socratic hints

## Data Models & Schemas

### Core Schemas (`app/schemas/mindmap.py`)
- **MindMapState**: Nodes, edges, and session context
- **SocraticHint**: AI-generated guidance with metadata
- **Node/Edge**: ReactFlow-compatible data structures

### Database Tables
- **study_sessions**: Session metadata and mind map state
- **sources**: Document tracking and metadata
- **document_sections**: Chunked content with embeddings

## Technology Stack

- **Backend**: FastAPI (Python 3.13) with Pydantic validation
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI (gpt-4o-mini for chat, text-embedding-3-small for embeddings)
- **Processing**: PyMuPDF for PDF extraction, semantic chunking
- **Frontend**: React 19 + Vite + ReactFlow (@xyflow/react)
- **Quality**: Ruff linting, pytest testing framework

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── app/
│   │   └── settings.py         # Central config (OpenAI, rate limits, etc.)
│   ├── api/v1/
│   │   ├── deps/              # Dependencies (auth middleware)
│   │   └── endpoints/         # API route handlers
│   │       ├── auth.py        # Authentication endpoints
│   │       ├── ingestion.py   # PDF upload endpoints
│   │       └── study.py       # Study session endpoints
│   ├── core/
│   │   ├── database.py        # Supabase client configuration
│   │   └── rate_limiter.py    # In-memory sliding-window rate limiter
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
├── tests/                      # Unit & integration tests
│   ├── unit/
│   │   ├── test_ingestion/
│   │   └── test_reasoning/
│   └── integration/
├── uploads/                    # Temporary PDF storage
├── pyproject.toml
└── uv.lock

frontend/
├── src/
│   ├── components/            # React components
│   │   ├── Dashboard.jsx
│   │   ├── MapCanvas.jsx
│   │   ├── Toolbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PdfViewer.jsx
│   │   ├── EditableNode.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/                 # Page components
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── contexts/              # React contexts
│   │   └── AuthContext.jsx
│   ├── services/              # API services
│   │   └── api.js
│   ├── lib/                   # Libraries
│   │   └── supabase.js
│   ├── utils/                 # Utilities
│   │   └── mapTransform.js
│   ├── config.js              # Environment configuration
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/                     # Static assets
├── package.json
└── vite.config.js
```
