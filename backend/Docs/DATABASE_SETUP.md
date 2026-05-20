# Database Setup

## Supabase Configuration

This guide walks you through setting up the Supabase database for Lumina.

## Prerequisites

1. A Supabase project with PostgreSQL and pgvector enabled
2. Access to the Supabase SQL Editor

## Enable pgvector Extension

Run in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Create Tables

### Sources Table

Stores uploaded PDF documents.

```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    page_count INTEGER NOT NULL,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sources_user_id ON sources(user_id);
```

### Study Sessions Table

Stores study sessions and mind map state.

```sql
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    mind_map_data JSONB DEFAULT '{"nodes": [], "edges": []}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_source_id ON study_sessions(source_id);
```

### Document Sections Table

Stores chunked PDF content with embeddings for vector search.

```sql
CREATE TABLE document_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INTEGER,
    chunk_index INTEGER,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_sections_source_id ON document_sections(source_id);
CREATE INDEX idx_document_sections_embedding ON document_sections USING ivfflat (embedding vector_cosine_ops);
```

## Storage Setup

Create a storage bucket for PDFs:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `pdfs`
3. Set as public bucket (or configure appropriate policies)

## Row Level Security (RLS)

Enable RLS and add policies:

```sql
-- Enable RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sections ENABLE ROW LEVEL SECURITY;

-- Sources: Users can only access their own data
CREATE POLICY "Users can view own sources" ON sources
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sources" ON sources
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Study Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON study_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sessions" ON study_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sessions" ON study_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- Document Sections: Access through sources
CREATE POLICY "Users can view sections of own sources" ON document_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sources 
            WHERE sources.id = document_sections.source_id 
            AND sources.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert sections for own sources" ON document_sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sources 
            WHERE sources.id = document_sections.source_id 
            AND sources.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete sections of own sources" ON document_sections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sources 
            WHERE sources.id = document_sections.source_id 
            AND sources.user_id = auth.uid()::text
        )
    );
```

## Environment Variables

Add these to your `backend/.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

Get these from Supabase Dashboard → Settings → API.

## Verification

Run this query to verify setup:

```sql
SELECT 
    (SELECT COUNT(*) FROM sources) as sources_count,
    (SELECT COUNT(*) FROM study_sessions) as sessions_count,
    (SELECT COUNT(*) FROM document_sections) as sections_count;
```
