-- Newsletters need a subject line distinct from the in-body title: the subject is
-- always "Hi {firstName} — {subject}" (personalized per recipient), while the title
-- is shown as the heading inside the email body itself.
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS subject text;
