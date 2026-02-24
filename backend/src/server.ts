import { env } from './config/env'; // Validates at bootstrap
import { logger } from './config/logger';
import { checkDbConnection, pool } from './config/db';
// import { checkRedisConnection, redis } from './config/redis';
import app from './app';

const startServer = async () => {
    const port = env.PORT;

    if (env.NODE_ENV === 'production' && process.env.NODE_ENV === 'development') {
        logger.fatal('❌ Critical Environment Mismatch. Halting boot.');
        process.exit(1);
    }

    // Verify Core Infrastructure Services before accepting traffic
    const dbUp = await checkDbConnection();

    if (!dbUp) {
        logger.fatal('❌ Critical infrastructure unreachable. Shutting down.');
        process.exit(1);
    }

    // One-time startup migrations (safe with IF NOT EXISTS)
    try {
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
        logger.info('✅ Startup migration applied: messages + notifications tables ready.');
    } catch (err) {
        logger.error({ err }, '⚠️ Startup migration warning (tables may already exist).');
    }

    // Google OAuth column migration (idempotent)
    try {
        await pool.query(`
            ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
        `);
        logger.info('✅ Startup migration applied: Google OAuth columns ready.');
    } catch (err) {
        logger.warn({ err }, '⚠️ Google OAuth migration warning (columns may already exist).');
    }

    const server = app.listen(port, () => {
        logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
        logger.info(`✅ API Version: ${env.APP_VERSION}`);
    });

    const shutdown = async (signal: string) => {
        logger.info(`[SYSTEM] ${signal} received. Initiating graceful shutdown...`);

        server.close(async () => {
            logger.info('[SYSTEM] HTTP server closed. Flushing external datastores.');
            try {
                await pool.end();
                logger.info('[SYSTEM] PostgreSQL pool closed.');
                // await (redis as any).quit();
                // logger.info('[SYSTEM] Redis connection closed.');

                logger.info('[SYSTEM] Graceful shutdown complete.');
                process.exit(0);
            } catch (err) {
                logger.error({ err }, '[SYSTEM] Error during cleanup shutdown');
                process.exit(1);
            }
        });

        setTimeout(() => {
            logger.fatal('[SYSTEM] Graceful shutdown bounds exceeded. Forcing Process Exit.');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
        logger.fatal({ err }, 'Unhandled Rejection');
        process.exit(1);
    });

    process.on('uncaughtException', (err) => {
        logger.fatal({ err }, 'Uncaught Exception');
        process.exit(1);
    });
};

startServer();
