-- migrations/15_add_reply_read_at.sql
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_read_at TIMESTAMP WITH TIME ZONE;

-- Index for performance when checking unread replies
CREATE INDEX IF NOT EXISTS idx_messages_reply_unread ON messages(id) WHERE reply_read_at IS NULL AND admin_reply IS NOT NULL;
