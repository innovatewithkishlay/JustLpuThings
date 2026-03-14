import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { pool } from '../config/db';

export const visitorTracker = async (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for specific paths to keep data clean
    const excludedPaths = ['/api/v1/health', '/api/v1/admin', '/api/v1/discovery'];
    if (excludedPaths.some(path => req.originalUrl.startsWith(path))) {
        return next();
    }

    try {
        // Extract IP (handling proxies like Render/Cloudflare)
        const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0];

        // Hash IP for privacy (GDPR/Compliance friendly)
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // Log the visit (fire and forget for performance)
        pool.query(
            'INSERT INTO visitor_logs (ip_hash) VALUES ($1)',
            [ipHash]
        ).catch(err => console.error('[VISITOR:LOG:ERR]', err));

        // Aggregate into daily_platform_stats (fire and forget)
        pool.query(`
            INSERT INTO daily_platform_stats (date, total_views, total_active_users, total_new_users)
            VALUES (CURRENT_DATE, 1, 0, 0)
            ON CONFLICT (date)
            DO UPDATE SET total_views = daily_platform_stats.total_views + 1
        `).catch(err => console.error('[DAILY:STATS:ERR]', err));

    } catch (err) {
        console.error('[VISITOR:TRACKER:ERR]', err);
    }

    next();
};

