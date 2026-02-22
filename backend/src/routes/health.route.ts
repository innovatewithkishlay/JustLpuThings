import { Router, Request, Response } from 'express';
import { checkDbConnection } from '../config/db';
import { checkRedisConnection, redis } from '../config/redis';
import { AnalyticsWorker } from '../modules/analytics/analytics.worker';
import pkg from '../../package.json';

const router = Router();

// /api/v1/health
router.get('/', async (req: Request, res: Response) => {
    const isDbConnected = await checkDbConnection();
    const isRedisConnected = await checkRedisConnection();

    res.status(isDbConnected && isRedisConnected ? 200 : 503).json({
        success: true,
        data: {
            status: isDbConnected && isRedisConnected ? 'ok' : 'degraded',
            uptime_seconds: Math.floor(process.uptime()),
            db_status: isDbConnected ? 'connected' : 'disconnected',
            redis_status: isRedisConnected ? 'connected' : 'disconnected',
            memory_usage: process.memoryUsage(),
            version: pkg.version || '1.0.0'
        }
    });
});

// /api/v1/health/worker
router.get('/worker', async (req: Request, res: Response) => {
    try {
        const queueLength = await redis.llen('analytics_queue');

        // Safety guard natively generating absolute limits warning over 100k depths mapping backpressure loops
        if (queueLength > 100000) {
            console.error(`[CRITICAL] Redis analytics_queue depth exceeds maximum threshold (${queueLength} items)`);
        }

        res.json({
            success: true,
            data: {
                is_running: AnalyticsWorker['isProcessing'], // internal state tracking mapped securely natively 
                last_run_at: AnalyticsWorker.lastRunAt,
                last_duration_ms: AnalyticsWorker.lastDurationMs,
                last_processed_count: AnalyticsWorker.lastProcessedCount,
                queue_length: queueLength
            }
        });
    } catch (error) {
        res.status(503).json({ success: false, error: { message: 'Redis unavailable' } });
    }
});

export default router;
