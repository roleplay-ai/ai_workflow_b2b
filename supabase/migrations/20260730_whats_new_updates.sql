-- Superadmin-managed release notes shown in the Ask AI "What's new" drawer.

create table if not exists public.whats_new_updates (
  id uuid primary key default gen_random_uuid(),
  tool text not null check (tool in ('chatgpt', 'claude', 'gemini', 'copilot')),
  title text not null check (char_length(title) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 1000),
  tag text not null check (char_length(tag) between 1 and 50),
  link_url text,
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whats_new_updates_published_idx
  on public.whats_new_updates (is_published, published_at desc);

alter table public.whats_new_updates enable row level security;

drop policy if exists "whats_new_updates_published_select" on public.whats_new_updates;
create policy "whats_new_updates_published_select"
  on public.whats_new_updates
  for select
  using (
    is_published = true
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superadmin'
    )
  );

drop policy if exists "whats_new_updates_superadmin_write" on public.whats_new_updates;
create policy "whats_new_updates_superadmin_write"
  on public.whats_new_updates
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superadmin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superadmin'
    )
  );
