-- Include optional quiz bonus (25% of activity points, scaled by quiz_score 0–100) in points totals
CREATE OR REPLACE FUNCTION public.get_my_points_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH me AS (
    SELECT id, company_id FROM profiles WHERE id = auth.uid()
  ),
  my_points AS (
    SELECT COALESCE(SUM(
      a.points + CASE
        WHEN up.quiz_score IS NOT NULL AND up.quiz_score > 0
        THEN ROUND(a.points * 0.25 * (up.quiz_score::numeric / 100))::int
        ELSE 0
      END
    ), 0)::int AS total
    FROM user_progress up
    JOIN activities a ON a.id = up.activity_id
    WHERE up.user_id = (SELECT id FROM me)
      AND up.status = 'completed'
  ),
  company_totals AS (
    SELECT
      p.id AS user_id,
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
    GROUP BY p.id
  )
  SELECT json_build_object(
    'user_points', (SELECT total FROM my_points),
    'company_size', (SELECT COUNT(*)::int FROM company_totals),
    'company_avg_points', (
      SELECT COALESCE(ROUND(AVG(total_points))::int, 0)
      FROM company_totals
    ),
    'company_percentile', CASE
      WHEN (SELECT company_id FROM me) IS NULL THEN NULL
      WHEN (SELECT COUNT(*) FROM company_totals) <= 1 THEN 100
      ELSE (
        SELECT (COUNT(*) FILTER (WHERE total_points < (SELECT total FROM my_points)) * 100
                / GREATEST((SELECT COUNT(*) FROM company_totals), 1))::int
        FROM company_totals
      )
    END
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_points_stats() TO authenticated;
