-- Weekly activity streak: counts consecutive Mon-Sun (UTC) weeks in which the
-- user has completed at least one activity. Missing a full week resets the
-- streak to 0, and the next completed activity restarts it at 1.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_week_start date;

CREATE OR REPLACE FUNCTION public.handle_streak_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start date := date_trunc('week', now() AT TIME ZONE 'utc')::date;
  cur_count integer;
  cur_week date;
BEGIN
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT streak_count, streak_week_start INTO cur_count, cur_week
  FROM profiles
  WHERE id = NEW.user_id
  FOR UPDATE;

  UPDATE profiles
  SET
    streak_count = CASE
      WHEN cur_week IS NULL THEN 1
      WHEN cur_week = week_start THEN cur_count
      WHEN cur_week = week_start - 7 THEN cur_count + 1
      ELSE 1
    END,
    streak_week_start = week_start
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_on_completion ON user_progress;
CREATE TRIGGER trg_streak_on_completion
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_streak_on_completion();
