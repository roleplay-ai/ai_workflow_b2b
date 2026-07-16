-- Optional RPC mirror of /api/fluency/view (sets user_id from auth.uid()).

CREATE OR REPLACE FUNCTION public.increment_fluency_view(
  p_entity_type text,
  p_entity_id text,
  p_session_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL OR p_session_id IS NULL
     OR length(trim(p_session_id)) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.fluency_views (entity_type, entity_id, session_id, user_id)
  VALUES (p_entity_type, p_entity_id, p_session_id, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_fluency_view(text, text, text) TO anon, authenticated, service_role;
