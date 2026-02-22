-- migrations/04_analytics_schema.sql

CREATE TABLE IF NOT EXISTS material_stats (
    material_id UUID PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
    total_views BIGINT DEFAULT 0,
    unique_users BIGINT DEFAULT 0,
    last_24h_views BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_platform_stats (
    date DATE PRIMARY KEY,
    total_views BIGINT DEFAULT 0,
    total_active_users BIGINT DEFAULT 0,
    total_new_users BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS abuse_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    count INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note: The PRIMARY KEY implies an index on material_id and date. 
-- Adding explicit indices just for clarity or additional coverage if needed.
CREATE INDEX IF NOT EXISTS idx_daily_platform_stats_date ON daily_platform_stats(date);
CREATE INDEX IF NOT EXISTS idx_abuse_events_user_id ON abuse_events(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_events_created_at ON abuse_events(created_at);
