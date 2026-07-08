-- Lets Ask AI suggest relevant workflows (activities) with a clickable link, using the
-- same free gte-small embeddings already used for the PDF knowledge base. Embeddings are
-- synced on demand from the superadmin Activities page ("Sync to Ask AI" button) rather
-- than automatically on every save — activities are edited from multiple places
-- (ActivityEditClient.tsx, the bulk-upload route), so a manual, explicit sync is simpler
-- and more robust than hooking every write path.

alter table activities add column if not exists embedding vector(384);

create index if not exists idx_activities_embedding
  on activities using hnsw (embedding vector_cosine_ops);

create or replace function match_activities(
  query_embedding vector(384),
  match_count int default 4
)
returns table (
  id uuid,
  title text,
  description text,
  similarity float
)
language sql stable
as $$
  select
    activities.id,
    activities.title,
    activities.description,
    1 - (activities.embedding <=> query_embedding) as similarity
  from activities
  where activities.published = true and activities.embedding is not null
  order by activities.embedding <=> query_embedding
  limit match_count;
$$;
