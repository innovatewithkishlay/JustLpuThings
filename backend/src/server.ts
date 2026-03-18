import { env } from './config/env'; // Validates at bootstrap
import { logger } from './config/logger';
import { checkDbConnection, pool } from './config/db';
import { runStartupMigrations } from './config/migrate';
import app from './app';

const startServer = async () => {
    const port = env.PORT;

    if (env.NODE_ENV === 'production' && process.env.NODE_ENV === 'development') {
        logger.fatal('❌ Critical Environment Mismatch. Halting boot.');
        process.exit(1);
    }

    // Verify Core Infrastructure & Run Migrations
    const dbUp = await checkDbConnection();
    if (!dbUp) {
        logger.fatal('❌ Critical infrastructure unreachable. Shutting down.');
        process.exit(1);
    }

    await runStartupMigrations();

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
