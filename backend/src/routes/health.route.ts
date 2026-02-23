import { Router, Request, Response } from 'express';
import { checkDbConnection } from '../config/db';
// import { checkRedisConnection, redis } from '../config/redis';
// import { AnalyticsWorker } from '../modules/analytics/analytics.worker';
import pkg from '../../package.json';

const router = Router();

// /api/v1/health
router.get('/', async (req: Request, res: Response) => {
    const isDbConnected = await checkDbConnection();
    const isRedisConnected = false; // await checkRedisConnection();

    res.status(isDbConnected ? 200 : 503).json({
        success: true,
        data: {
            status: isDbConnected ? 'ok' : 'degraded',
            uptime_seconds: Math.floor(process.uptime()),
            db_status: isDbConnected ? 'connected' : 'disconnected',
            redis_status: 'disabled-temporarily',
            memory_usage: process.memoryUsage(),
            version: pkg.version || '1.0.0'
        }
    });

});

// /api/v1/health/worker
router.get('/worker', async (req: Request, res: Response) => {
    try {
        // const queueLength = await redis.llen('analytics_queue');
        const queueLength = 0;

        // Safety guard natively generating absolute limits warning over 100k depths mapping backpressure loops
        if (queueLength > 100000) {
            console.error(`[CRITICAL] Redis analytics_queue depth exceeds maximum threshold (${queueLength} items)`);
        }

        res.json({
            success: true,
            data: {
                is_running: false, // AnalyticsWorker['isProcessing'], // internal state tracking mapped securely natively 
                last_run_at: null, // AnalyticsWorker.lastRunAt,
                last_duration_ms: 0, // AnalyticsWorker.lastDurationMs,
                last_processed_count: 0, // AnalyticsWorker.lastProcessedCount,
                queue_length: queueLength
            }
        });
    } catch (error) {
        res.status(503).json({ success: false, error: { message: 'Redis unavailable' } });
    }
});

export default router;
