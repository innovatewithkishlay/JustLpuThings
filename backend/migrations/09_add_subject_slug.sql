-- migrations/09_add_subject_slug.sql
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing subjects to have a slug if they don't (based on name)
-- We'll just lowercase and replace spaces with hyphens for the existing ones
UPDATE subjects SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;

-- Make slug NOT NULL and add a unique constraint with semester_id
ALTER TABLE subjects ALTER COLUMN slug SET NOT NULL;
ALTER TABLE subjects ADD CONSTRAINT idx_subjects_semester_slug UNIQUE (semester_id, slug);

-- Also add a unique constraint for (college_id, number) on semesters to allow ON CONFLICT DO UPDATE
ALTER TABLE semesters ADD CONSTRAINT idx_semesters_college_number UNIQUE (college_id, number);
