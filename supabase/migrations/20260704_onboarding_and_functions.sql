-- Onboarding survey answers on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_tool text,
  ADD COLUMN IF NOT EXISTS onboarding_tool_tier text,
  ADD COLUMN IF NOT EXISTS onboarding_tool_other text,
  ADD COLUMN IF NOT EXISTS onboarding_function text,
  ADD COLUMN IF NOT EXISTS onboarding_function_other text,
  ADD COLUMN IF NOT EXISTS onboarding_interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_interests_other text,
  ADD COLUMN IF NOT EXISTS onboarding_experience text;

-- Grandfather existing users so only new signups see the mandatory survey
UPDATE profiles SET onboarding_completed_at = now() WHERE onboarding_completed_at IS NULL;

-- Job-department tags catalog (distinct from activity_categories, which holds
-- outcome tags like "Automate Email & Tasks")
CREATE TABLE IF NOT EXISTS activity_functions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  description   text,
  icon_url      text,
  thumbnail_url text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Job-department tags on activities (distinct from activities.categories)
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS functions text[] NOT NULL DEFAULT '{}';

-- Frozen snapshot of each user's personalized "My Workflows" list
CREATE TABLE IF NOT EXISTS user_saved_workflows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_workflows_user_id ON user_saved_workflows(user_id);
