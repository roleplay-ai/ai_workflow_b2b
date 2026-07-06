-- AI Workflow Assistant knowledge base (RAG): PDFs uploaded by superadmin,
-- chunked + embedded for retrieval, with embedded images extracted per page
-- (not full-page renders — see RAG_ASSISTANT_ARCHITECTURE.md §3a).

create extension if not exists vector;

-- One row per PDF uploaded by a superadmin.
create table if not exists kb_documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  storage_path  text not null,          -- path in the `kb-documents` Storage bucket
  page_count    integer,
  status        text not null default 'pending'
                  check (status in ('pending', 'processing', 'ready', 'error')),
  next_page     integer not null default 0, -- incremental-ingestion cursor (§4.1)
  error_message text,
  uploaded_by   uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One row per page's extracted text (the source material chunking reads from).
create table if not exists kb_document_pages (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references kb_documents(id) on delete cascade,
  page_number   integer not null,
  raw_text      text,
  unique (document_id, page_number)
);

-- One row per extracted embedded image (NOT a full-page render).
create table if not exists kb_document_images (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references kb_documents(id) on delete cascade,
  page_number   integer not null,
  image_path    text not null,          -- path in the `kb-extracted-images` Storage bucket
  width         integer,
  height        integer,
  created_at    timestamptz not null default now()
);

create index if not exists idx_kb_document_images_doc_page
  on kb_document_images(document_id, page_number);

-- One row per text chunk + its embedding (the retrieval unit).
create table if not exists kb_chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references kb_documents(id) on delete cascade,
  page_start     integer not null,
  page_end       integer not null,
  content        text not null,
  embedding      vector(384),           -- gte-small output dimension
  token_count    integer,
  created_at     timestamptz not null default now()
);

create index if not exists kb_chunks_embedding_idx
  on kb_chunks using hnsw (embedding vector_cosine_ops);

create index if not exists idx_kb_chunks_document on kb_chunks(document_id);

-- Conversation log (quality review + abuse monitoring).
create table if not exists kb_chat_messages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id),
  session_id   uuid not null,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  cited_chunks uuid[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists idx_kb_chat_messages_session on kb_chat_messages(session_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Read: any authenticated user (retrieval + citations must work for every
-- company). Write: superadmin only. Matches the pattern already used for
-- activity_functions in 20260704c_rls_functions_and_saved_workflows.sql.

alter table kb_documents        enable row level security;
alter table kb_document_pages   enable row level security;
alter table kb_document_images  enable row level security;
alter table kb_chunks           enable row level security;
alter table kb_chat_messages    enable row level security;

drop policy if exists "kb_documents_select_all" on kb_documents;
create policy "kb_documents_select_all" on kb_documents
  for select using (auth.uid() is not null);

drop policy if exists "kb_documents_superadmin_write" on kb_documents;
create policy "kb_documents_superadmin_write" on kb_documents
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "kb_document_pages_select_all" on kb_document_pages;
create policy "kb_document_pages_select_all" on kb_document_pages
  for select using (auth.uid() is not null);

drop policy if exists "kb_document_pages_superadmin_write" on kb_document_pages;
create policy "kb_document_pages_superadmin_write" on kb_document_pages
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "kb_document_images_select_all" on kb_document_images;
create policy "kb_document_images_select_all" on kb_document_images
  for select using (auth.uid() is not null);

drop policy if exists "kb_document_images_superadmin_write" on kb_document_images;
create policy "kb_document_images_superadmin_write" on kb_document_images
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "kb_chunks_select_all" on kb_chunks;
create policy "kb_chunks_select_all" on kb_chunks
  for select using (auth.uid() is not null);

drop policy if exists "kb_chunks_superadmin_write" on kb_chunks;
create policy "kb_chunks_superadmin_write" on kb_chunks
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "kb_chat_messages_owner_select" on kb_chat_messages;
create policy "kb_chat_messages_owner_select" on kb_chat_messages
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "kb_chat_messages_owner_insert" on kb_chat_messages;
create policy "kb_chat_messages_owner_insert" on kb_chat_messages
  for insert with check (auth.uid() = user_id);

-- ── Storage buckets ──────────────────────────────────────────────────────
-- kb-documents: original PDFs, superadmin-only (no end user ever needs the
-- raw file). kb-extracted-images: public, same convention as activity-icons
-- etc. — every citation thumbnail is fetched via getPublicUrl().

insert into storage.buckets (id, name, public)
values ('kb-documents', 'kb-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('kb-extracted-images', 'kb-extracted-images', true)
on conflict (id) do nothing;

drop policy if exists "kb_documents_bucket_superadmin_all" on storage.objects;
create policy "kb_documents_bucket_superadmin_all" on storage.objects
  for all using (
    bucket_id = 'kb-documents'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  )
  with check (
    bucket_id = 'kb-documents'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "kb_extracted_images_bucket_public_read" on storage.objects;
create policy "kb_extracted_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'kb-extracted-images');

drop policy if exists "kb_extracted_images_bucket_superadmin_write" on storage.objects;
create policy "kb_extracted_images_bucket_superadmin_write" on storage.objects
  for insert with check (
    bucket_id = 'kb-extracted-images'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "kb_extracted_images_bucket_superadmin_delete" on storage.objects;
create policy "kb_extracted_images_bucket_superadmin_delete" on storage.objects
  for delete using (
    bucket_id = 'kb-extracted-images'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

-- ── Retrieval ────────────────────────────────────────────────────────────
-- pgvector cosine-distance search, called from app/api/ask via supabase.rpc().
-- No SECURITY DEFINER — runs as the caller, so the kb_chunks select RLS policy
-- (any authenticated user) still applies.

create or replace function match_kb_chunks(
  query_embedding vector(384),
  match_count int default 6
)
returns table (
  id uuid,
  document_id uuid,
  page_start integer,
  page_end integer,
  content text,
  similarity float
)
language sql stable
as $$
  select
    kb_chunks.id,
    kb_chunks.document_id,
    kb_chunks.page_start,
    kb_chunks.page_end,
    kb_chunks.content,
    1 - (kb_chunks.embedding <=> query_embedding) as similarity
  from kb_chunks
  order by kb_chunks.embedding <=> query_embedding
  limit match_count;
$$;
