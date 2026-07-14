-- Store provisional lab passwords so welcome emails can be sent via Resend
-- without relying on a local spreadsheet. Auth still uses Supabase Auth hashes;
-- this column is only for outbound credential emails (service role / scripts).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS initial_password text,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

COMMENT ON COLUMN profiles.initial_password IS
  'Provisional plaintext password for welcome emails only. Not used for auth.';
COMMENT ON COLUMN profiles.welcome_email_sent_at IS
  'When the lab welcome email was last sent via Resend.';

-- Prevent client roles from reading/writing plaintext passwords via PostgREST.
REVOKE ALL (initial_password) ON public.profiles FROM PUBLIC;
REVOKE ALL (initial_password) ON public.profiles FROM anon;
REVOKE ALL (initial_password) ON public.profiles FROM authenticated;

-- Scripts / admin APIs use the service role key.
GRANT SELECT (initial_password), INSERT (initial_password), UPDATE (initial_password)
  ON public.profiles TO service_role;
