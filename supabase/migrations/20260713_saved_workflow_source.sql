-- Distinguish onboarding-suggested saves from user heart/likes so preference
-- recomputes can replace suggestions without wiping manually liked workflows.
ALTER TABLE user_saved_workflows
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'onboarding';

ALTER TABLE user_saved_workflows
  DROP CONSTRAINT IF EXISTS user_saved_workflows_source_check;

ALTER TABLE user_saved_workflows
  ADD CONSTRAINT user_saved_workflows_source_check
  CHECK (source IN ('onboarding', 'liked'));

CREATE INDEX IF NOT EXISTS idx_user_saved_workflows_user_source
  ON user_saved_workflows(user_id, source);
