-- "Ask our team" support flow: when Ask AI can't answer a question, the user can send it
-- to a human. No outbound email provider exists in this repo yet, so this stores the
-- request for staff to review and follow up on manually from a superadmin inbox page.

create table if not exists support_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references profiles(id),
  session_id     uuid,
  question       text not null,
  context        text,
  reply_to_email text not null,
  status         text not null default 'open' check (status in ('open', 'resolved')),
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz,
  resolved_by    uuid references profiles(id)
);

create index if not exists idx_support_requests_status on support_requests(status, created_at desc);

alter table support_requests enable row level security;

drop policy if exists "support_requests_owner_select" on support_requests;
create policy "support_requests_owner_select" on support_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "support_requests_owner_insert" on support_requests;
create policy "support_requests_owner_insert" on support_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "support_requests_superadmin_update" on support_requests;
create policy "support_requests_superadmin_update" on support_requests
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );
