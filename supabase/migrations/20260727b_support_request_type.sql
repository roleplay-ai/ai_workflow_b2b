-- Distinguish "Ask our team" (an unanswered question) from "Contact us for full
-- access" (an anonymous visitor requesting an account) so superadmins see them as
-- separate lists instead of one undifferentiated inbox.

alter table support_requests
  add column if not exists request_type text not null default 'unanswered_question'
  check (request_type in ('unanswered_question', 'access_request'));

create index if not exists idx_support_requests_type_status on support_requests(request_type, status, created_at desc);
