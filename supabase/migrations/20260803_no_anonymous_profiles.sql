-- Anonymous (is_anonymous) auth sessions are for browse/Ask-AI RLS + footfall
-- tracking only. They must NOT get a row in public.profiles.
--
-- 1) Retarget anon-writable user_id FKs from profiles → auth.users
-- 2) Skip profile creation for anonymous sign-ups in handle_new_user
-- 3) Delete existing anonymous profile rows (auth.users rows stay)

-- ---------------------------------------------------------------------------
-- 1. Point user_id FKs used by anonymous traffic at auth.users
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  on_delete text;
BEGIN
  FOR r IN
    SELECT
      c.conname,
      rel.relname AS table_name,
      pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_class ref ON ref.oid = c.confrelid
    JOIN pg_namespace refnsp ON refnsp.oid = ref.relnamespace
    WHERE c.contype = 'f'
      AND nsp.nspname = 'public'
      AND refnsp.nspname = 'public'
      AND ref.relname = 'profiles'
      AND rel.relname IN (
        'anonymous_visits',
        'kb_chat_messages',
        'ask_conversations',
        'support_requests',
        'activity_views',
        'fluency_views'
      )
  LOOP
    on_delete := CASE
      WHEN r.def ILIKE '%ON DELETE CASCADE%' THEN 'CASCADE'
      WHEN r.def ILIKE '%ON DELETE SET NULL%' THEN 'SET NULL'
      WHEN r.def ILIKE '%ON DELETE RESTRICT%' THEN 'RESTRICT'
      WHEN r.def ILIKE '%ON DELETE NO ACTION%' THEN 'NO ACTION'
      ELSE 'SET NULL'
    END;

    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.conname);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE %s',
      r.table_name,
      r.conname,
      on_delete
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Create / replace handle_new_user so anonymous users get no profile.
--    Real users still land on the Public company by default (matches current
--    blank-profile company_id behavior); company scripts/admins can reassign.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  public_company_id uuid;
BEGIN
  IF NEW.is_anonymous IS TRUE THEN
    RETURN NEW;
  END IF;

  SELECT id INTO public_company_id
  FROM public.companies
  WHERE name ILIKE 'Public'
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    public_company_id
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      company_id = COALESCE(public.profiles.company_id, EXCLUDED.company_id);

  RETURN NEW;
END;
$$;

-- Ensure the standard auth trigger points at this function (idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Belt-and-suspenders: if any other trigger still inserts a profile for an
-- anonymous user, remove it immediately after.
CREATE OR REPLACE FUNCTION public.cleanup_anonymous_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous IS TRUE THEN
    DELETE FROM public.profiles WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_cleanup_anon ON auth.users;
CREATE TRIGGER on_auth_user_created_cleanup_anon
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.is_anonymous IS TRUE)
  EXECUTE FUNCTION public.cleanup_anonymous_profile();

-- ---------------------------------------------------------------------------
-- 3. Remove existing anonymous profiles (auth users + visit/chat rows remain)
-- ---------------------------------------------------------------------------
DELETE FROM public.profiles p
USING auth.users u
WHERE p.id = u.id
  AND u.is_anonymous IS TRUE;
