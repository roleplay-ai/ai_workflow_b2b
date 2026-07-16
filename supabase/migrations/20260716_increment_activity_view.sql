-- Restore activity view tracking used by /api/activity/[id]/view.
-- Sets user_id from auth.uid() when the caller is signed in.

CREATE OR REPLACE FUNCTION public.increment_activity_view(
  p_activity_id uuid,
  p_session_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_activity_id IS NULL OR p_session_id IS NULL OR length(trim(p_session_id)) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.activity_views (activity_id, session_id, user_id)
  VALUES (p_activity_id, p_session_id, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_activity_view(uuid, text) TO anon, authenticated, service_role;
