-- Display metadata for the participant Workflows category library.
-- This does not rename or seed categories: existing Supabase content remains authoritative.

ALTER TABLE public.activity_categories
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

ALTER TABLE public.activity_categories
  ALTER COLUMN display_order SET DEFAULT 1000;

-- Establish the supplied HTML's initial participant order without renaming or
-- deleting database categories. Admins can change these values later.
UPDATE public.activity_categories AS category
SET
  display_order = seed.display_order,
  icon = COALESCE(category.icon, seed.icon),
  is_visible = true
FROM (
  VALUES
    ('Get Set Up', 10, '⚙'),
    ('Automate Email & Tasks', 20, '✉'),
    ('Make Presentations', 30, '▧'),
    ('Organize Knowledge in One Place', 40, '▤'),
    ('Analyze Data', 50, '▥'),
    ('Delegate Multi-Step Work to an Agent', 60, '✦'),
    ('Generate Videos', 70, '▶'),
    ('Make Your Chatbot Remember You', 80, '◉'),
    ('Build a Voice Chatbot', 90, '⌁'),
    ('Build a Web App', 100, '</>'),
    ('Teach AI Your Way of Working', 110, '✎'),
    ('Build a Text Chatbot', 120, '◌'),
    ('Research the Market', 130, '⌕'),
    ('Generate Images', 140, '◇'),
    ('Build a Website', 150, '▦'),
    ('Data Security', 160, '⌾')
) AS seed(name, display_order, icon)
WHERE lower(category.name) = lower(seed.name);

-- These generic legacy rows overlap the specific participant categories above.
-- They remain available in the database and admin tooling.
UPDATE public.activity_categories
SET is_visible = false
WHERE name IN ('Automate', 'Build', 'Chat', 'Setup');

CREATE INDEX IF NOT EXISTS idx_activity_categories_visible_order
  ON public.activity_categories (is_visible, display_order, name);
