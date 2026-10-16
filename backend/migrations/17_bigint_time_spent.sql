-- migrations/17_bigint_time_spent.sql
-- Same change as run_migration_17_bigint.js (leaderboard "integer out of range" fix),
-- kept here so a database built from this folder matches production. Safe to re-run.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'material_progress' AND column_name = 'time_spent' AND data_type = 'integer') THEN
        ALTER TABLE material_progress ALTER COLUMN time_spent TYPE BIGINT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'user_reading_history' AND column_name = 'time_spent_increment' AND data_type = 'integer') THEN
        ALTER TABLE user_reading_history ALTER COLUMN time_spent_increment TYPE BIGINT;
    END IF;
END $$;
