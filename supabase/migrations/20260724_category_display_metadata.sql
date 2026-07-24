-- Display metadata for the participant Workflows category library.
-- This does not rename or seed categories: existing Supabase content remains authoritative.

ALTER TABLE public.activity_categories
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_activity_categories_visible_order
  ON public.activity_categories (is_visible, display_order, name);

