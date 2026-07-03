-- Disambiguate the existing content-type column before reusing "category"
-- for the renamed job-function concept below.
ALTER TABLE activities RENAME COLUMN category TO content_type;

-- Rename the job-function catalog and its tag column to "categories".
ALTER TABLE activity_functions RENAME TO activity_categories;
ALTER TABLE activities RENAME COLUMN functions TO categories;
