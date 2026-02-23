-- migrations/10_add_time_spent_to_progress.sql

ALTER TABLE material_progress ADD COLUMN IF NOT EXISTS time_spent INT NOT NULL DEFAULT 0;
