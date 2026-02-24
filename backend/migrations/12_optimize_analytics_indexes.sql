-- migrations/12_optimize_analytics_indexes.sql

-- Speed up user engagement sorting by last_active (MAX(updated_at))
CREATE INDEX IF NOT EXISTS idx_material_progress_user_updated ON material_progress(user_id, updated_at DESC);

-- Speed up global material view aggregation
CREATE INDEX IF NOT EXISTS idx_material_stats_views ON material_stats(total_views DESC);
