-- Each news item can link to its original article from the "Read update" card.
ALTER TABLE fluency_brief_items
  ADD COLUMN IF NOT EXISTS link_url text;
