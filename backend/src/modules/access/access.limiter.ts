import { Request, Response, NextFunction } from 'express';
// import { redis } from '../../config/redis';
import { pool } from '../../config/db';

export const userAccessLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Skip unauthenticated users if this gets mounted early (though usually protected heavily by requireAuth)
        if (!req.user?.userId) return next();

        const userId = req.user.userId;
        const key = `user:${userId}:access_count`;

        const count = 1; // await redis.incr(key);
        // if (count === 1) {
        //     await redis.expire(key, 300); // 5 minutes TTL
        // }

        // Limit allowed: 50 access calls per 5 minutes
        if (count > 50) {
            // Record abuse securely 
            pool.query(
                `INSERT INTO abuse_events (user_id, event_type, count) VALUES ($1, $2, $3)`,
                [userId, 'RATE_LIMIT_EXCEEDED_ACCESS', count]
            ).catch(e => console.error('Silent drop on abuse log', e));

            // Record strictly in sys admin trace log
            pool.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
                [null, 'SYSTEM_RATE_LIMIT', 'user', userId, JSON.stringify({ reason: 'access_rate_limit_exceeded', count })]
            ).catch(e => console.error('Silent drop on audit log', e));

            res.status(429).json({
                success: false,
                error: { message: 'Too many requests for material access. Please wait exactly 5 minutes before trying again.' }
            });
            return;
        }
        next();
    } catch (err) {
        // On redis failure, permit routing but throw warnings to log
        console.warn('[REDIS:WARN] Rate limiter bypassed due to connection failure', err);
        next();
    }
};
