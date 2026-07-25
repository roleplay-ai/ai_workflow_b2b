-- Saved workflows are now created only by an explicit participant heart/like.
-- Remove legacy onboarding suggestions so they are not mistaken for user saves,
-- and make all future rows default to the liked source.

BEGIN;

DELETE FROM user_saved_workflows
WHERE source = 'onboarding';

ALTER TABLE user_saved_workflows
  ALTER COLUMN source SET DEFAULT 'liked';

ALTER TABLE user_saved_workflows
  DROP CONSTRAINT IF EXISTS user_saved_workflows_source_check;

ALTER TABLE user_saved_workflows
  ADD CONSTRAINT user_saved_workflows_source_check
  CHECK (source = 'liked');

COMMENT ON TABLE user_saved_workflows IS
  'Participant workflows explicitly saved with the heart action.';

COMMENT ON COLUMN user_saved_workflows.source IS
  'Save origin. Retained for compatibility; all current rows are explicit likes.';

COMMIT;
