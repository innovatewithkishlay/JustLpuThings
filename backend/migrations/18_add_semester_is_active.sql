-- migrations/18_add_semester_is_active.sql
-- semesters.is_active is read by the materials and admin services (and toggled from the
-- admin panel) but was never created by a migration. No-op where it already exists.
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;
