import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const reqId = req.headers['x-request-id'] || 'unknown';

    if (err.statusCode !== 404) {
        logger.error({ err, reqId }, err.message || 'Internal Server Error');
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            requestId: reqId,
            ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
        }
    });
};
