-- Persist the Ask AI tool filter on the signed-in user's profile.

alter table public.profiles
  add column if not exists preferred_ai_tool text
  check (
    preferred_ai_tool is null
    or preferred_ai_tool in ('all', 'chatgpt', 'claude', 'gemini', 'copilot')
  );

create or replace function public.set_preferred_ai_tool(p_tool text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_tool is not null
    and p_tool not in ('all', 'chatgpt', 'claude', 'gemini', 'copilot') then
    raise exception 'Invalid AI tool';
  end if;

  update public.profiles
  set preferred_ai_tool = p_tool
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  return p_tool;
end;
$$;

revoke all on function public.set_preferred_ai_tool(text) from public;
revoke all on function public.set_preferred_ai_tool(text) from anon;
grant execute on function public.set_preferred_ai_tool(text) to authenticated;
