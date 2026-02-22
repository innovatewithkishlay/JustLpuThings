import { Request, Response, NextFunction } from 'express';

export const requestMetrics = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        const logData = {
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode,
            responseTime: duration,
            userId: req.user?.userId || 'anonymous',
            requestId: req.headers['x-request-id']
        };

        if (duration > 3000) {
            console.error('[METRICS:ERROR] Extremely Slow Request:', logData);
        } else if (duration > 1000) {
            console.warn('[METRICS:WARN] Slow Request:', logData);
        } else {
            // Optional: uncomment for verbose debug logging
            // console.log('[METRICS:INFO]', logData);
        }
    });

    next();
};
