-- Tracks when a user locks in their personalized workflow list after review.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS workflows_confirmed_at timestamptz;

-- Grandfather users who already completed onboarding so they skip the review banner.
UPDATE profiles
SET workflows_confirmed_at = onboarding_completed_at
WHERE workflows_confirmed_at IS NULL
  AND onboarding_completed_at IS NOT NULL;
