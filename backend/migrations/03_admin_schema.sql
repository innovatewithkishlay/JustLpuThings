-- migrations/03_admin_schema.sql

-- A. Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- B. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);

-- C. Ensure material_views and material_progress have ON DELETE CASCADE
-- We created them with ON DELETE CASCADE in 02_materials_schema.sql, 
-- but we make sure they cover users(id) correctly. (Already handled in Phase 3 creation).

-- Additional cascading safety for refresh tokens
-- (Already handled with ON DELETE CASCADE in 01_auth_schema.sql).
