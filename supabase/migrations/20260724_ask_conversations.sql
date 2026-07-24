-- Persistent Ask AI conversation metadata.
-- Existing kb_chat_messages remain the message source of truth; their session_id
-- becomes the conversation id so historical messages can be reopened.

CREATE TABLE IF NOT EXISTS public.ask_conversations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          text NOT NULL DEFAULT 'New conversation',
  model          text NOT NULL DEFAULT 'claude-sonnet-5',
  effort         text NOT NULL DEFAULT 'medium'
                   CHECK (effort IN ('low', 'medium', 'high')),
  is_saved       boolean NOT NULL DEFAULT false,
  is_pinned      boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ask_conversations_user_updated
  ON public.ask_conversations (user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ask_conversations_user_pinned
  ON public.ask_conversations (user_id, is_pinned DESC, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Preserve structured UI state when a conversation is reopened. New assistant
-- messages can store citations and recommended-workflow card data here.
ALTER TABLE public.kb_chat_messages
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill one conversation row per existing chat session. The first message is
-- used as the initial title; the application may later generate or edit it.
INSERT INTO public.ask_conversations (
  id,
  user_id,
  title,
  model,
  effort,
  created_at,
  updated_at
)
SELECT DISTINCT ON (m.session_id)
  m.session_id,
  m.user_id,
  LEFT(REGEXP_REPLACE(m.content, '\s+', ' ', 'g'), 120),
  'claude-sonnet-5',
  'medium',
  m.created_at,
  (
    SELECT MAX(latest.created_at)
    FROM public.kb_chat_messages latest
    WHERE latest.session_id = m.session_id
  )
FROM public.kb_chat_messages m
ORDER BY m.session_id, m.created_at
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kb_chat_messages_session_conversation_fkey'
      AND conrelid = 'public.kb_chat_messages'::regclass
  ) THEN
    ALTER TABLE public.kb_chat_messages
      ADD CONSTRAINT kb_chat_messages_session_conversation_fkey
      FOREIGN KEY (session_id)
      REFERENCES public.ask_conversations(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_ask_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Backward compatibility: the currently deployed Ask route writes messages
-- directly. Ensure those writes automatically create/touch their conversation
-- row even before the conversation-history UI is deployed.
CREATE OR REPLACE FUNCTION public.ensure_ask_conversation_for_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ask_conversations (
    id,
    user_id,
    title,
    model,
    effort,
    created_at,
    updated_at
  )
  VALUES (
    NEW.session_id,
    NEW.user_id,
    CASE
      WHEN NEW.role = 'user'
      THEN LEFT(REGEXP_REPLACE(NEW.content, '\s+', ' ', 'g'), 120)
      ELSE 'New conversation'
    END,
    'claude-sonnet-5',
    'medium',
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE
    SET updated_at = GREATEST(
      public.ask_conversations.updated_at,
      EXCLUDED.updated_at
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ask_conversations_updated_at
  ON public.ask_conversations;

CREATE TRIGGER trg_ask_conversations_updated_at
BEFORE UPDATE ON public.ask_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_ask_conversation_updated_at();

DROP TRIGGER IF EXISTS trg_ensure_ask_conversation_for_message
  ON public.kb_chat_messages;

CREATE TRIGGER trg_ensure_ask_conversation_for_message
BEFORE INSERT ON public.kb_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.ensure_ask_conversation_for_message();

ALTER TABLE public.ask_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ask_conversations_owner_select"
  ON public.ask_conversations;
CREATE POLICY "ask_conversations_owner_select"
  ON public.ask_conversations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "ask_conversations_owner_insert"
  ON public.ask_conversations;
CREATE POLICY "ask_conversations_owner_insert"
  ON public.ask_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ask_conversations_owner_update"
  ON public.ask_conversations;
CREATE POLICY "ask_conversations_owner_update"
  ON public.ask_conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ask_conversations_owner_delete"
  ON public.ask_conversations;
CREATE POLICY "ask_conversations_owner_delete"
  ON public.ask_conversations
  FOR DELETE
  USING (auth.uid() = user_id);
