-- Per-user AI Foundations completion. Each module awards five points exactly
-- once; the completion RPC is idempotent and the points RPCs include the award.

CREATE TABLE IF NOT EXISTS public.user_fluency_progress (
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id      uuid NOT NULL REFERENCES public.fluency_modules(id) ON DELETE CASCADE,
  points_awarded integer NOT NULL DEFAULT 5 CHECK (points_awarded >= 0),
  completed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_fluency_progress_user_completed
  ON public.user_fluency_progress (user_id, completed_at DESC);

ALTER TABLE public.user_fluency_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_fluency_progress_owner_select"
  ON public.user_fluency_progress;
CREATE POLICY "user_fluency_progress_owner_select"
  ON public.user_fluency_progress
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

-- Completion writes go through complete_fluency_module() so clients cannot
-- choose their own points value.
CREATE OR REPLACE FUNCTION public.complete_fluency_module(p_module_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_rows integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.fluency_modules
    WHERE id = p_module_id
      AND published = true
  ) THEN
    RAISE EXCEPTION 'Published AI Foundation module not found';
  END IF;

  INSERT INTO public.user_fluency_progress (
    user_id,
    module_id,
    points_awarded
  )
  VALUES (
    v_user_id,
    p_module_id,
    5
  )
  ON CONFLICT (user_id, module_id) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN json_build_object(
    'completed', true,
    'newly_completed', v_rows > 0,
    'points_awarded', CASE WHEN v_rows > 0 THEN 5 ELSE 0 END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_fluency_module(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_fluency_module(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_points_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH me AS (
    SELECT id, company_id
    FROM public.profiles
    WHERE id = auth.uid()
  ),
  activity_totals AS (
    SELECT
      up.user_id,
      COALESCE(SUM(
        a.points + CASE
          WHEN up.quiz_score IS NOT NULL AND up.quiz_score > 0
          THEN ROUND(a.points * 0.25 * (up.quiz_score::numeric / 100))::int
          ELSE 0
        END
      ), 0)::int AS points
    FROM public.user_progress up
    JOIN public.activities a ON a.id = up.activity_id
    WHERE up.status = 'completed'
    GROUP BY up.user_id
  ),
  foundation_totals AS (
    SELECT
      user_id,
      COALESCE(SUM(points_awarded), 0)::int AS points
    FROM public.user_fluency_progress
    GROUP BY user_id
  ),
  my_points AS (
    SELECT (
      COALESCE((SELECT points FROM activity_totals WHERE user_id = me.id), 0)
      + COALESCE((SELECT points FROM foundation_totals WHERE user_id = me.id), 0)
    )::int AS total
    FROM me
  ),
  company_totals AS (
    SELECT
      p.id AS user_id,
      (
        COALESCE(a.points, 0)
        + COALESCE(f.points, 0)
      )::int AS total_points
    FROM public.profiles p
    LEFT JOIN activity_totals a ON a.user_id = p.id
    LEFT JOIN foundation_totals f ON f.user_id = p.id
    WHERE p.company_id = (SELECT company_id FROM me)
      AND (SELECT company_id FROM me) IS NOT NULL
  )
  SELECT json_build_object(
    'user_points', COALESCE((SELECT total FROM my_points), 0),
    'company_size', (SELECT COUNT(*)::int FROM company_totals),
    'company_avg_points', (
      SELECT COALESCE(ROUND(AVG(total_points))::int, 0)
      FROM company_totals
    ),
    'company_percentile', CASE
      WHEN (SELECT company_id FROM me) IS NULL THEN NULL
      WHEN (SELECT COUNT(*) FROM company_totals) <= 1 THEN 100
      ELSE (
        SELECT (
          COUNT(*) FILTER (
            WHERE total_points < COALESCE((SELECT total FROM my_points), 0)
          ) * 100
          / GREATEST((SELECT COUNT(*) FROM company_totals), 1)
        )::int
        FROM company_totals
      )
    END
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_points_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_company_leaderboard()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH me AS (
    SELECT id, company_id
    FROM public.profiles
    WHERE id = auth.uid()
  ),
  activity_totals AS (
    SELECT
      up.user_id,
      COALESCE(SUM(
        a.points + CASE
          WHEN up.quiz_score IS NOT NULL AND up.quiz_score > 0
          THEN ROUND(a.points * 0.25 * (up.quiz_score::numeric / 100))::int
          ELSE 0
        END
      ), 0)::int AS points
    FROM public.user_progress up
    JOIN public.activities a ON a.id = up.activity_id
    WHERE up.status = 'completed'
    GROUP BY up.user_id
  ),
  foundation_totals AS (
    SELECT
      user_id,
      COALESCE(SUM(points_awarded), 0)::int AS points
    FROM public.user_fluency_progress
    GROUP BY user_id
  ),
  company_totals AS (
    SELECT
      p.id AS user_id,
      p.full_name,
      p.avatar_url,
      (
        COALESCE(a.points, 0)
        + COALESCE(f.points, 0)
      )::int AS total_points
    FROM public.profiles p
    LEFT JOIN activity_totals a ON a.user_id = p.id
    LEFT JOIN foundation_totals f ON f.user_id = p.id
    WHERE p.company_id = (SELECT company_id FROM me)
      AND (SELECT company_id FROM me) IS NOT NULL
      AND p.role = 'user'
  ),
  ranked AS (
    SELECT
      user_id,
      full_name,
      avatar_url,
      total_points,
      RANK() OVER (ORDER BY total_points DESC)::int AS rank,
      ROW_NUMBER() OVER (
        ORDER BY total_points DESC, full_name ASC NULLS LAST, user_id
      )::int AS position
    FROM company_totals
  )
  SELECT json_build_object(
    'company_size', (SELECT COUNT(*)::int FROM ranked),
    'top', COALESCE((
      SELECT json_agg(json_build_object(
        'user_id', user_id,
        'full_name', full_name,
        'avatar_url', avatar_url,
        'points', total_points,
        'rank', rank
      ) ORDER BY position)
      FROM ranked
      WHERE position <= 5
    ), '[]'::json),
    'all', COALESCE((
      SELECT json_agg(json_build_object(
        'user_id', user_id,
        'full_name', full_name,
        'avatar_url', avatar_url,
        'points', total_points,
        'rank', rank
      ) ORDER BY position)
      FROM ranked
    ), '[]'::json),
    'me', (
      SELECT json_build_object(
        'user_id', user_id,
        'full_name', full_name,
        'avatar_url', avatar_url,
        'points', total_points,
        'rank', rank
      )
      FROM ranked
      WHERE user_id = (SELECT id FROM me)
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_company_leaderboard() TO authenticated;
