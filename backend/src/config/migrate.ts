import { pool } from './db';
import { logger } from './logger';

export const runStartupMigrations = async () => {
    logger.info('[MIGRATION] Starting database schema verification...');

    try {
        // Core tables: messages + notifications
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
                admin_reply TEXT,
                replied_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
            CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('reply', 'announcement', 'warning')),
                read_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
        `);
        logger.info('✅ Core tables verified (messages, notifications)');

        // Google OAuth columns
        await pool.query(`
            ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_google_id_unique') THEN
                    CREATE UNIQUE INDEX idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
                END IF;
            END $$;
        `);
        logger.info('✅ User table columns verified (Google OAuth)');

        // Analytics tables (Phase 32)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitor_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ip_hash TEXT NOT NULL,
                visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON visitor_logs(visited_at);

            CREATE TABLE IF NOT EXISTS daily_platform_stats (
                date DATE PRIMARY KEY,
                total_views INTEGER DEFAULT 0,
                total_active_users INTEGER DEFAULT 0,
                total_new_users INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        logger.info('✅ Analytics tables verified (visitor_logs, daily_stats)');

        logger.info('🚀 Database schema is fully synchronized.');
        return true;
    } catch (err) {
        logger.error({ err }, '❌ Database migration failed');
        return false;
    }
};
