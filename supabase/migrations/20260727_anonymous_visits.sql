-- Footfall tracking for anonymous (no-account) visitors: one row per new anonymous
-- session created in middleware.ts, capturing IP + user agent so staff can get a
-- rough sense of anonymous traffic volume/origin without requiring login.

create table if not exists anonymous_visits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id),
  ip_address  text,
  user_agent  text,
  path        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_anonymous_visits_created_at on anonymous_visits(created_at desc);

alter table anonymous_visits enable row level security;

drop policy if exists "anonymous_visits_owner_insert" on anonymous_visits;
create policy "anonymous_visits_owner_insert" on anonymous_visits
  for insert with check (auth.uid() = user_id);

drop policy if exists "anonymous_visits_superadmin_select" on anonymous_visits;
create policy "anonymous_visits_superadmin_select" on anonymous_visits
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );
