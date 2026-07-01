-- Featured tags for learner topbar spotlight panel
ALTER TABLE activity_tags
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_description text,
  ADD COLUMN IF NOT EXISTS featured_position integer DEFAULT 0;
