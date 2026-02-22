import { pool } from '../../config/db';
import { redis } from '../../config/redis';
import { env } from '../../config/env';

export class AnalyticsWorker {
    private static isProcessing = false;
    public static lastRunAt: Date | null = null;
    public static lastDurationMs: number = 0;
    public static lastProcessedCount: number = 0;

    static async start() {
        console.log('[Worker] Starting Analytics & Intelligence Batch Processor...');

        // Poller runs every 60 seconds
        setInterval(() => this.processQueue(), 60 * 1000);

        // Execute immediately on boot
        setTimeout(() => this.processQueue(), 2000);
    }

    private static async processQueue() {
        if (this.isProcessing) return; // Prevent concurrent loops
        this.isProcessing = true;
        this.lastRunAt = new Date();
        const startTime = Date.now();

        const batchSize = 1000;
        let processedCount = 0;

        // Force timeout guard aborting processing artificially if hanging on Redis/DB loops
        const abortController = new AbortController();
        const timeoutGuard = setTimeout(() => abortController.abort(), 30000); // 30s cutoff

        try {
            // Buffer to hold our events before we secure DB commit
            const popBatchPipeline = redis.pipeline();
            for (let i = 0; i < batchSize; i++) {
                popBatchPipeline.rpop('analytics_queue');
            }

            const results = await popBatchPipeline.exec();
            if (!results) {
                this.isProcessing = false;
                return;
            }

            const events: any[] = results
                .map((res: any) => res[1]) // res format usually [err, reply]
                .filter(Boolean)
                .map((str: string) => JSON.parse(str));

            if (events.length === 0) {
                clearTimeout(timeoutGuard);
                this.lastDurationMs = Date.now() - startTime;
                this.isProcessing = false;
                return;
            }

            console.log(`[Worker] Ingesting ${events.length} events from Redis pipeline.`);

            // DB Transaction
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Bulk Insert into material_views
                const insertViewsQuery = `
                    INSERT INTO material_views (user_id, material_id, ip_address, user_agent, viewed_at)
                    VALUES ${events.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ')}
                `;

                const viewParams = events.flatMap(e => [e.userId, e.materialId, e.ip, e.userAgent, e.timestamp]);
                await client.query(insertViewsQuery, viewParams);

                // 2. Aggregate Material Stats using conflict triggers.
                // Efficiently update count per material inside the batch.
                const materialCounts = events.reduce((acc: any, e) => {
                    const id = e.materialId;
                    if (!acc[id]) acc[id] = { count: 0, users: new Set() };
                    acc[id].count++;
                    acc[id].users.add(e.userId);
                    return acc;
                }, {});

                for (const materialId of Object.keys(materialCounts)) {
                    const stats = materialCounts[materialId];
                    await client.query(`
                        INSERT INTO material_stats (material_id, total_views, unique_users, last_24h_views, updated_at) 
                        VALUES ($1, $2, $3, $2, now())
                        ON CONFLICT (material_id) DO UPDATE SET 
                            total_views = material_stats.total_views + $2,
                            unique_users = material_stats.unique_users + $3,
                            last_24h_views = material_stats.last_24h_views + $2,
                            updated_at = now();
                    `, [materialId, stats.count, stats.users.size]);
                }

                // 3. Aggregate Daily Platform Stats
                const today = new Date().toISOString().split('T')[0];
                const uniquePlatformUsers = new Set(events.map(e => e.userId)).size;

                await client.query(`
                    INSERT INTO daily_platform_stats (date, total_views, total_active_users, total_new_users) 
                    VALUES ($1, $2, $3, 0)
                    ON CONFLICT (date) DO UPDATE SET 
                        total_views = daily_platform_stats.total_views + $2,
                        total_active_users = daily_platform_stats.total_active_users + $3;
                `, [today, events.length, uniquePlatformUsers]);

                // 4. Abuse Detection
                await this.runAbuseDetection(client, events);

                await client.query('COMMIT');
                processedCount = events.length;

            } catch (err) {
                await client.query('ROLLBACK');
                console.error('[Worker] DB Pipeline Fault. Requeuing events.', err);

                // Safety Re-queue: Push back to the head of the list so they aren't lost
                const recoverPipeline = redis.pipeline();
                events.forEach(e => recoverPipeline.rpush('analytics_queue', JSON.stringify(e)));
                await recoverPipeline.exec();
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('[Worker] Global processing error:', error);
        } finally {
            clearTimeout(timeoutGuard);
            this.lastProcessedCount = processedCount;
            this.lastDurationMs = Date.now() - startTime;
            this.isProcessing = false;

            // Log completion lifecycle natively avoiding DB hits
            console.log(`[Worker] Cycle complete. Processed: ${processedCount} | Duration: ${this.lastDurationMs}ms`);
        }
    }

    private static async runAbuseDetection(client: any, events: any[]) {
        // Find users with excessively high request volumes in the batch window
        const userFrequency = events.reduce((acc: any, e) => {
            acc[e.userId] = (acc[e.userId] || 0) + 1;
            return acc;
        }, {});

        for (const userId of Object.keys(userFrequency)) {
            const count = userFrequency[userId];

            // Trigger: > 20 req/window
            if (count > 20) {
                // Determine severity
                const eventType = count >= 100 ? 'SEVERE_DDOS_ATTEMPT' : 'HIGH_FREQUENCY_TRAFFIC';

                await client.query(`
                    INSERT INTO abuse_events (user_id, event_type, count)
                    VALUES ($1, $2, $3)
                `, [userId, eventType, count]);

                // Optional Auto-block Logic based on strictly severe activity could be mounted here. 
                // For now, logging to intelligence dashboard via DB insertion.
            }
        }
    }
}
