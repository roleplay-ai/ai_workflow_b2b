-- Company leaderboard for the My Progress page: top 5, full list, plus the caller's own rank.
CREATE OR REPLACE FUNCTION public.get_company_leaderboard()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH me AS (
    SELECT id, company_id FROM profiles WHERE id = auth.uid()
  ),
  company_totals AS (
    SELECT
      p.id AS user_id,
      p.full_name,
      p.avatar_url,
      COALESCE(SUM(
        a.points + CASE
          WHEN up.quiz_score IS NOT NULL AND up.quiz_score > 0
          THEN ROUND(a.points * 0.25 * (up.quiz_score::numeric / 100))::int
          ELSE 0
        END
      ), 0)::int AS total_points
    FROM profiles p
    LEFT JOIN user_progress up
      ON up.user_id = p.id AND up.status = 'completed'
    LEFT JOIN activities a ON a.id = up.activity_id
    WHERE p.company_id = (SELECT company_id FROM me)
      AND (SELECT company_id FROM me) IS NOT NULL
      AND p.role = 'user'
    GROUP BY p.id, p.full_name, p.avatar_url
  ),
  ranked AS (
    SELECT
      user_id, full_name, avatar_url, total_points,
      RANK() OVER (ORDER BY total_points DESC)::int AS rank,
      ROW_NUMBER() OVER (
        ORDER BY total_points DESC, full_name ASC NULLS LAST, user_id
      )::int AS position
    FROM company_totals
  )
  SELECT json_build_object(
    'company_size', (SELECT COUNT(*)::int FROM ranked),
    -- Use ROW_NUMBER position (not RANK) so ties don't inflate the top list past 5.
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
