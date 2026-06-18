-- Enable the pgvector extension.
-- Must exist BEFORE Mastra PgVector / semantic-recall init (phases 04/05),
-- otherwise vector index creation fails. Run via: pnpm -F @uni-gpt/db db:setup
CREATE EXTENSION IF NOT EXISTS vector;
