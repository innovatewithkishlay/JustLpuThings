import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const reqId = req.headers['x-request-id'] || 'unknown';

    // Invalid request input: answer 400 with the first readable message
    // instead of a 500 carrying the raw validation dump.
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: {
                message: err.issues[0]?.message || 'Invalid request',
                requestId: reqId,
            }
        });
    }

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
