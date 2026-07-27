-- The anonymous free-chat cap needs to be enforced per IP address, not per anonymous
-- session — otherwise clearing cookies (which creates a brand-new anonymous user_id)
-- resets the counter. Recording the sender's IP on each anonymous user message lets
-- /api/ask count usage across every anonymous session from the same IP.

alter table kb_chat_messages
  add column if not exists ip_address text;

create index if not exists idx_kb_chat_messages_ip_created on kb_chat_messages(ip_address, created_at desc);
